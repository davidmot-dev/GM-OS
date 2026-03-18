export class HardwareAnonymizer {
  /**
   * Masks sensitive bridge credentials (IP, Username)
   */
  static anonymize(input: string, secrets: { hueBridgeIp: string; hueUsername: string }): string {
    let sanitized = input;
    
    if (secrets.hueBridgeIp && secrets.hueBridgeIp.length > 5) {
      sanitized = sanitized.split(secrets.hueBridgeIp).join('***.***.***.***');
    }
    
    if (secrets.hueUsername && secrets.hueUsername.length > 5) {
      sanitized = sanitized.split(secrets.hueUsername).join('*******************');
    }
    
    return sanitized;
  }
}
