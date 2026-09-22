// 供应商工厂：DETECT_PROVIDER 环境变量决定用哪家（02 文档 §6）。
// 当前可用：heuristic（本地启发式，零成本零依赖）。
// 接入正式供应商时：新建 provider-xxx.ts 实现 DetectorProvider，在此注册，改 env 即切换。
import type { DetectorProvider } from './types';
import { heuristicDetector } from './heuristic';

const providers: Record<string, DetectorProvider> = {
  heuristic: heuristicDetector,
};

export function getDetector(name?: string): DetectorProvider {
  return providers[name ?? 'heuristic'] ?? heuristicDetector;
}
