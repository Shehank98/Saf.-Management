import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.service';
import { SafariLoader } from '../../components/animations/SafariLoader';
import { Card } from '../../components/common/Card';
import { Colors } from '../../theme/colors';
import { formatDate, formatCurrency, daysUntil } from '../../utils/formatters';

interface Props { navigation: any; }

function JobCard({ job, type, index, onPress }: { job: any; type: 'jeep' | 'guide'; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 70, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  const safari  = job.sharedJeep || job.privateSafari;
  const isShared = !!job.sharedJeep;
  const safariDate = safari?.safariDate;
  const days    = safariDate ? daysUntil(safariDate) : null;
  const fee     = type === 'jeep' ? job.rentalFee : job.guideFee;
  const guestCount = job.sharedJeep?.bookings?.length || 0;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Card style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View style={styles.jobLeft}>
              <Text style={styles.jobType}>{safari?.safariType || 'Safari'}</Text>
              <Text style={styles.jobDate}>{safariDate ? formatDate(safariDate) : '—'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isShared ? '#DCFCE7' : '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: isShared ? '#166534' : '#92400E' }]}>
                {isShared ? '🚙 Shared' : '👑 Private'}
              </Text>
            </View>
          </View>

          <View style={styles.jobMeta}>
            {type === 'guide' && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🧭</Text>
                <Text style={styles.metaText}>Guide</Text>
              </View>
            )}
            {type === 'jeep' && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🚙</Text>
                <Text style={styles.metaText}>{job.jeepNumber || 'Jeep'}</Text>
              </View>
            )}
            {isShared && guestCount > 0 && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>👥</Text>
                <Text style={styles.metaText}>{guestCount} guests</Text>
              </View>
            )}
            {days !== null && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏰</Text>
                <Text style={[styles.metaText, days <= 1 && { color: Colors.error, fontWeight: '700' }]}>
                  {days === 0 ? 'TODAY' : days === 1 ? 'Tomorrow' : `${days} days`}
                </Text>
              </View>
            )}
            <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
              <Text style={styles.feeText}>{formatCurrency(parseFloat(fee))}</Text>
              <Text style={[styles.payStatus, { color: job.paymentStatus === 'PAID' ? Colors.success : Colors.warning }]}>
                {job.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Pending'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function JobsScreen({ navigation }: Props) {
  const titleAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-jobs'],
    queryFn: async () => {
      const res = await api.get('/vendors/jobs');
      return res.data.data;
    },
  });

  useEffect(() => {
    Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  if (isLoading) return <SafariLoader text="Loading your jobs..." />;

  const jeepJobs  = data?.jeepJobs  || [];
  const guideJobs = data?.guideJobs || [];
  const allJobs   = [
    ...jeepJobs.map((j: any)  => ({ ...j, type: 'jeep'  as const })),
    ...guideJobs.map((j: any) => ({ ...j, type: 'guide' as const })),
  ].sort((a, b) => {
    const da = (a.sharedJeep || a.privateSafari)?.safariDate;
    const db = (b.sharedJeep || b.privateSafari)?.safariDate;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        <Animated.View style={[styles.header, {
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }]}>
          <Text style={styles.title}>My Jobs</Text>
          <Text style={styles.subtitle}>{allJobs.length} upcoming assignment{allJobs.length !== 1 ? 's' : ''}</Text>
        </Animated.View>

        {allJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Upcoming Jobs</Text>
            <Text style={styles.emptyText}>You'll see your job assignments here once an owner assigns you to a safari.</Text>
          </Card>
        ) : (
          allJobs.map((job: any, i: number) => (
            <JobCard
              key={`${job.type}-${job.id}`}
              job={job}
              type={job.type}
              index={i}
              onPress={() => navigation.navigate('JobDetail', { job })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scroll:     { padding: 16, paddingBottom: 40 },
  header:     { marginBottom: 20 },
  title:      { fontSize: 24, fontWeight: '800', color: Colors.gray[900] },
  subtitle:   { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  jobCard:    { marginBottom: 12 },
  jobHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  jobLeft:    {},
  jobType:    { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  jobDate:    { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  jobMeta:    { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon:   { fontSize: 14 },
  metaText:   { fontSize: 13, color: Colors.gray[600] },
  feeText:    { fontSize: 15, fontWeight: '800', color: Colors.primary, textAlign: 'right' },
  payStatus:  { fontSize: 11, fontWeight: '600', textAlign: 'right', marginTop: 2 },
  emptyCard:  { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[700], marginBottom: 6 },
  emptyText:  { fontSize: 14, color: Colors.gray[400], textAlign: 'center' },
});
