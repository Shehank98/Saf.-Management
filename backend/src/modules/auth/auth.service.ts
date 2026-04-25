import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { RegisterInput, LoginInput } from './dto/register.dto';
import { AuthPayload } from '../../types';
import { addDays } from '../../utils/date-helpers';

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY as any });
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
  });
  if (exists) throw Object.assign(new Error('Email or phone already registered'), { status: 409 });

  const hashedPassword = await bcrypt.hash(input.password, 12);

  // CUSTOMER auto-approved; SAFARI_OWNER/VENDOR start PENDING (need admin approval)
  const approvalStatus = input.role === 'CUSTOMER' ? 'APPROVED' as const : 'PENDING' as const;

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        password: hashedPassword,
        role: input.role as any,
        name: input.name,
        approvalStatus,
      },
    });

    if (input.role === 'VENDOR') {
      if (!input.vendorType || !input.businessName) {
        throw new Error('Vendor type and business name required');
      }
      await tx.vendor.create({
        data: {
          userId: newUser.id,
          vendorType: input.vendorType as any,
          businessName: input.businessName,
          businessAddress: input.businessAddress,
        },
      });
    } else if (input.role === 'SAFARI_OWNER') {
      if (!input.companyName || !input.companyAddress) {
        throw new Error('Company name and address required');
      }
      await tx.safariOwner.create({
        data: {
          userId: newUser.id,
          companyName: input.companyName,
          companyAddress: input.companyAddress,
        },
      });
    } else if (input.role === 'CUSTOMER') {
      await tx.customer.create({ data: { userId: newUser.id } });
    }

    return newUser;
  });

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
  };
  const { accessToken, refreshToken } = generateTokens(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approvalStatus: user.approvalStatus,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (user.role !== 'SUPER_ADMIN' && user.approvalStatus !== 'APPROVED') {
    if (user.approvalStatus === 'REJECTED') {
      const err = Object.assign(new Error('Account rejected. Contact support.'), { status: 403 });
      (err as any).code = 'ACCOUNT_REJECTED';
      throw err;
    }
    const err = Object.assign(new Error('Account pending approval. You will be notified once approved.'), { status: 403 });
    (err as any).code = 'PENDING_APPROVAL';
    throw err;
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
  };
  const { accessToken, refreshToken } = generateTokens(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approvalStatus: user.approvalStatus,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { token } });
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const payload: AuthPayload = {
    userId: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
    approvalStatus: stored.user.approvalStatus,
  };
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

  await prisma.refreshToken.delete({ where: { token } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.user.id,
      expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      approvalNote: true,
      features: { select: { feature: true, enabled: true } },
      vendor: { select: { businessName: true, vendorType: true, subscriptionStatus: true } },
      safariOwner: { select: { companyName: true, subscriptionStatus: true } },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}
