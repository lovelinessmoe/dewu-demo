import {
  TokenResponse,
  InvoiceItem,
  InvoiceListResponse,
  MerchantInfoResponse,
  SellerPost,
  ErrorCodes
} from '../types/index';

/**
 * Mock data generator utilities for creating realistic test data matching Dewu specification
 */
export class MockDataGenerator {

  /**
   * Generate a mock OAuth2 token response matching Dewu format
   */
  static generateTokenResponse(openId?: string): TokenResponse {
    const accessTokenExpiresIn = 31536000; // 1 year as per Dewu spec
    const refreshTokenExpiresIn = 31536000; // 1 year as per Dewu spec

    return {
      code: 200,
      msg: 'success',
      data: {
        scope: ['all'],
        open_id: openId || this.generateOpenId(),
        access_token: this.generateAccessToken(),
        access_token_expires_in: accessTokenExpiresIn,
        refresh_token: this.generateRefreshToken(),
        refresh_token_expires_in: refreshTokenExpiresIn
      },
      status: 200
    };
  }

  /**
   * Generate a mock invoice item matching Dewu specification
   */
  static generateInvoiceItem(overrides?: Partial<InvoiceItem>): InvoiceItem {
    const statuses = [0, 1, 2, 3, 4, 5, 6]; // Dewu status codes
    const invoiceTypes = [1, 2]; // 1: electronic, 2: paper
    const categoryTypes = [1, 2]; // 1: electronic, 2: paper
    const invoiceTitleTypes = [1, 2]; // 1: personal/institution, 2: enterprise
    
    const baseInvoice: InvoiceItem = {
      invoice_title: this.generateCompanyName(),
      seller_reject_reason: Math.random() > 0.7 ? this.generateRejectReason() : '',
      verify_time: this.generateRandomDateString(-7),
      category_type: categoryTypes[Math.floor(Math.random() * categoryTypes.length)],
      order_time: this.generateRandomDateString(-30),
      invoice_image_url: `https://example.com/invoice/${this.generateRandomString(16)}.jpg`,
      bank_name: this.generateBankName(),
      invoice_type: invoiceTypes[Math.floor(Math.random() * invoiceTypes.length)],
      company_address: this.generateAddress(),
      article_number: this.generateProductName(),
      bidding_price: Math.floor(Math.random() * 50000) + 1000,
      spu_id: Math.floor(Math.random() * 10000) + 1,
      invoice_title_type: invoiceTitleTypes[Math.floor(Math.random() * invoiceTitleTypes.length)],
      spu_title: this.generateProductTitle(),
      bank_account: this.generateBankAccount(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      upload_time: this.generateRandomDateString(-15),
      apply_time: this.generateRandomDateString(-20),
      company_phone: this.generatePhoneNumber(),
      handle_flag: Math.random() > 0.5 ? 1 : 0,
      amount: Math.floor(Math.random() * 50000) + 1000,
      seller_post: this.generateSellerPost(),
      sku_id: Math.floor(Math.random() * 100000) + 1,
      reject_time: Math.random() > 0.8 ? this.generateRandomDateString(-5) : '',
      order_no: this.generateOrderNumber(),
      properties: this.generateProductProperties(),
      tax_number: this.generateTaxNumber(),
      reject_reason: Math.random() > 0.7 ? this.generateRejectReason() : '',
      seller_post_appointment: Math.random() > 0.5
    };

    return { ...baseInvoice, ...overrides };
  }

  /**
   * Generate multiple mock invoice items
   */
  static generateInvoiceItems(count: number, overrides?: Partial<InvoiceItem>): InvoiceItem[] {
    return Array.from({ length: count }, () => this.generateInvoiceItem(overrides));
  }

  /**
   * Generate a mock invoice list response matching Dewu format
   */
  static generateInvoiceListResponse(
    pageNo: number = 1,
    pageSize: number = 10,
    totalCount?: number
  ): InvoiceListResponse {
    const total = totalCount || Math.floor(Math.random() * 100) + 20;
    const invoiceItems = this.generateInvoiceItems(Math.min(pageSize, total));

    return {
      trace_id: this.generateTraceId(),
      code: 200,
      msg: 'success',
      data: {
        page_no: pageNo,
        page_size: pageSize,
        total_results: total,
        list: invoiceItems
      }
    };
  }

  /**
   * Generate a mock merchant info response matching Dewu format
   */
  static generateMerchantInfoResponse(): MerchantInfoResponse {
    return {
      domain: '',
      code: 200,
      msg: 'success',
      data: {
        merchant_id: this.generateMerchantId(),
        type_id: this.generateTypeId()
      },
      errors: []
    };
  }

  /**
   * Generate a mock merchant info object
   */
  static generateMerchantInfo(): any {
    return {
      merchant_id: this.generateMerchantId(),
      name: this.generateCompanyName(),
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      created_at: new Date().toISOString(),
      contact_info: {
        email: `merchant${Math.floor(Math.random() * 1000)}@example.com`,
        phone: this.generatePhoneNumber()
      }
    };
  }

  // Private utility methods for generating realistic Dewu-specific data

  private static generateOpenId(): string {
    return this.generateRandomString(16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  private static generateAccessToken(): string {
    return this.generateRandomString(58, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  private static generateRefreshToken(): string {
    return this.generateRandomString(58, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  private static generateMerchantId(): string {
    return this.generateRandomString(16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  private static generateTypeId(): string {
    return this.generateRandomString(12, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }

  static generateTraceId(): string {
    return this.generateRandomString(32, '0123456789');
  }

  private static generateOrderNumber(): string {
    return '11001' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  private static generateCompanyName(): string {
    const companies = [
      '得物科技有限公司',
      '上海潮流科技',
      '北京时尚贸易',
      '深圳创新企业',
      '杭州电商公司',
      '广州数字科技',
      '成都智能制造',
      '武汉新零售'
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  private static generateBankName(): string {
    const banks = [
      '中国银行',
      '工商银行',
      '建设银行',
      '农业银行',
      '招商银行',
      '交通银行',
      '中信银行',
      '民生银行'
    ];
    return banks[Math.floor(Math.random() * banks.length)];
  }

  private static generateBankAccount(): string {
    return '开户银行账号' + Math.floor(Math.random() * 1000000000).toString();
  }

  private static generateAddress(): string {
    const addresses = [
      '湖南省长沙市天心区赤岭路45号长沙理工大学金盆岭校区',
      '上海市普陀区交通局888号',
      '北京市朝阳区建国门外大街1号',
      '深圳市南山区科技园南区',
      '杭州市西湖区文三路259号',
      '广州市天河区珠江新城',
      '成都市高新区天府大道',
      '武汉市洪山区光谷大道'
    ];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  private static generateProductName(): string {
    const products = [
      'iPhone 14-黑色',
      'iPhone 13-白色',
      'iPhone 12-蓝色',
      'MacBook Pro-银色',
      'iPad Air-玫瑰金',
      'AirPods Pro-白色',
      'Apple Watch-黑色',
      'iMac-银色'
    ];
    return products[Math.floor(Math.random() * products.length)];
  }

  private static generateProductTitle(): string {
    const titles = [
      '【现货发售】Apple iPhone 14 黑色 全网通双卡双待5G手机',
      '【现货发售】Apple iPhone 13 白色 全网通双卡双待5G手机',
      '【现货发售】Apple iPhone 12 蓝色 全网通双卡双待5G手机',
      '【现货发售】Apple MacBook Pro 银色 M2芯片笔记本电脑',
      '【现货发售】Apple iPad Air 玫瑰金 平板电脑',
      '【现货发售】Apple AirPods Pro 白色 无线蓝牙耳机',
      '【现货发售】Apple Watch 黑色 智能手表',
      '【现货发售】Apple iMac 银色 一体机电脑'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private static generateProductProperties(): string {
    const properties = [
      '官方标配 128GB',
      '官方标配 256GB',
      '官方标配 512GB',
      '官方标配 1TB',
      '标准版 64GB',
      '高配版 256GB',
      '顶配版 512GB',
      '限量版 1TB'
    ];
    return properties[Math.floor(Math.random() * properties.length)];
  }

  private static generateTaxNumber(): string {
    return '91' + Math.floor(Math.random() * 1000000000000000000).toString().padStart(15, '0');
  }

  private static generateRejectReason(): string {
    const reasons = [
      '查询不到公司税号',
      '发票信息不完整',
      '税号与开票公司名称不匹配',
      '请提供真实姓名',
      '因疫情暂无法开具或邮寄',
      '发票金额超出限制',
      '开票信息有误',
      '缺少必要证明文件'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private static generateSellerPost(): SellerPost {
    const logistics = ['顺丰速运', '圆通快递', '中通快递', '申通快递', '韵达快递', '百世快递'];
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];
    
    return {
      express_no: 'SF' + Math.floor(Math.random() * 10000000000000).toString(),
      take_end_time: this.generateRandomDateString(-1, true),
      sender_name: names[Math.floor(Math.random() * names.length)],
      take_start_time: this.generateRandomDateString(-2, true),
      logistics_name: logistics[Math.floor(Math.random() * logistics.length)],
      sender_full_address: this.generateAddress()
    };
  }

  private static generatePhoneNumber(): string {
    const areaCodes = ['010', '021', '0755', '0571', '020', '028', '027'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${areaCode}-${number}`;
  }

  private static generateRandomString(length: number, chars?: string): string {
    const characters = chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  private static generateRandomDate(daysAgo: number): Date {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * Math.abs(daysAgo));
    const date = new Date(now);
    date.setDate(date.getDate() - randomDays);
    return date;
  }

  private static generateRandomDateString(daysAgo: number, withTime: boolean = false): string {
    const date = this.generateRandomDate(daysAgo);
    if (withTime) {
      const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
      const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
      const seconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} 23:54:48`;
  }
}