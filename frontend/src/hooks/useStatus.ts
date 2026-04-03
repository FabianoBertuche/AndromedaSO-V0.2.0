import { useQuery } from '@tanstack/react-query';
import { fetchKernelStatus } from '../api/kernel';

export function useStatus() {
  return useQuery({
    queryKey: ['kernel-status'],
    queryFn: fetchKernelStatus,
    refetchInterval: 2500,
    refetchOnWindowFocus: true
  });
}
