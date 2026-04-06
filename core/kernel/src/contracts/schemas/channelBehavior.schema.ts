import { z } from 'zod';

export const channelBehaviorSchema = z.record(z.string(), z.unknown()).default({});
export type ChannelBehavior = z.infer<typeof channelBehaviorSchema>;