// 检测供应商统一接口（02-技术架构文档 §6）。
// 自研模型不在计划内：供应商通过 DETECT_PROVIDER 环境变量切换，业务代码不感知。

export interface SentenceFlag {
  offset: number;
  len: number;
  flag: 'high' | 'mid' | 'low';
}

export interface DetectResult {
  score: number; // 0..1，AI 生成概率
  sentences: SentenceFlag[];
}

export interface DetectorProvider {
  name: string;
  detect(text: string): Promise<DetectResult>;
}
