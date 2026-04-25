import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(['VENDOR', 'SAFARI_OWNER', 'CUSTOMER']),
  // Vendor-specific
  vendorType: z.enum(['JEEP_PROVIDER', 'GUIDE', 'RESTAURANT', 'ACCOMMODATION', 'CAMERA_RENTAL', 'OTHER']).optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  // Owner-specific
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
