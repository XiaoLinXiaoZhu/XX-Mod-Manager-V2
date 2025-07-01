/**
 * 简单的256位哈希函数实现
 * 基于SHA-256的核心思想，但简化实现
 */
export class SimpleHash {
  private static readonly K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  private static readonly H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  /**
   * 计算字符串的256位哈希值
   * @param input 输入字符串
   * @returns 64字符的十六进制哈希字符串
   */
  static hash256(input: string): string {
    // 转换为字节数组
    const bytes = this.stringToBytes(input);
    
    // 预处理：添加填充
    const paddedBytes = this.padMessage(bytes);
    
    // 初始化哈希值
    const h = [...this.H];
    
    // 处理每个512位块
    for (let i = 0; i < paddedBytes.length; i += 64) {
      const chunk = paddedBytes.slice(i, i + 64);
      this.processChunk(chunk, h);
    }
    
    // 转换为十六进制字符串
    return h.map(word => word.toString(16).padStart(8, '0')).join('');
  }

  private static stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3f));
        bytes.push(0x80 | (code & 0x3f));
      } else {
        // UTF-16 代理对
        i++;
        const hi = code;
        const lo = str.charCodeAt(i);
        const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
        bytes.push(0xf0 | (codePoint >> 18));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
        bytes.push(0x80 | (codePoint & 0x3f));
      }
    }
    return bytes;
  }

  private static padMessage(bytes: number[]): number[] {
    const originalLength = bytes.length;
    const bitLength = originalLength * 8;
    
    // 添加填充位
    const padded = [...bytes, 0x80];
    
    // 填充到长度为 448 mod 512
    while (padded.length % 64 !== 56) {
      padded.push(0);
    }
    
    // 添加原始长度（64位大端序）
    for (let i = 7; i >= 0; i--) {
      padded.push((bitLength >>> (i * 8)) & 0xff);
    }
    
    return padded;
  }

  private static processChunk(chunk: number[], h: number[]): void {
    // 创建消息调度数组
    const w = new Array(64);
    
    // 复制块到前16个字
    for (let i = 0; i < 16; i++) {
      w[i] = (chunk[i * 4] << 24) | 
             (chunk[i * 4 + 1] << 16) | 
             (chunk[i * 4 + 2] << 8) | 
             chunk[i * 4 + 3];
    }
    
    // 扩展到64个字
    for (let i = 16; i < 64; i++) {
      const s0 = this.rotr(w[i - 15], 7) ^ this.rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = this.rotr(w[i - 2], 17) ^ this.rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    
    // 初始化工作变量
    let [a, b, c, d, e, f, g, h0] = h;
    
    // 主循环
    for (let i = 0; i < 64; i++) {
      const S1 = this.rotr(e, 6) ^ this.rotr(e, 11) ^ this.rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h0 + S1 + ch + this.K[i] + w[i]) >>> 0;
      const S0 = this.rotr(a, 2) ^ this.rotr(a, 13) ^ this.rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      
      h0 = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    
    // 添加到哈希值
    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + h0) >>> 0;
  }

  private static rotr(x: number, n: number): number {
    return (x >>> n) | (x << (32 - n));
  }
}

/**
 * 便捷函数：计算字符串的256位哈希值
 * @param input 输入字符串
 * @returns 64字符的十六进制哈希字符串
 */
export function hash256(input: string): string {
  return SimpleHash.hash256(input);
}