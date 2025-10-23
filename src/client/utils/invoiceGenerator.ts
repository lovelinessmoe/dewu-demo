import type { InvoiceItem } from '../types/api'

// 随机数据生成器
class InvoiceDataGenerator {
  private companies = [
    '得物科技有限公司',
    '上海潮流科技',
    '深圳创新企业',
    '杭州电商公司',
    '广州数字科技',
    '北京智能科技',
    '成都互联网公司',
    '武汉软件开发',
    '南京电子商务',
    '苏州信息技术'
  ]

  private products = [
    { name: 'iPhone 15 Pro', price: 89900, spu: 10001 },
    { name: 'iPhone 15', price: 59900, spu: 10002 },
    { name: 'MacBook Pro M3', price: 149900, spu: 10003 },
    { name: 'iPad Air', price: 45900, spu: 10004 },
    { name: 'AirPods Pro', price: 18900, spu: 10005 },
    { name: 'Apple Watch', price: 29900, spu: 10006 },
    { name: 'Nike Air Jordan', price: 12900, spu: 20001 },
    { name: 'Adidas Yeezy', price: 19900, spu: 20002 },
    { name: 'Supreme Box Logo', price: 8900, spu: 30001 },
    { name: 'Off-White Hoodie', price: 45900, spu: 30002 }
  ]

  private banks = [
    '中国银行',
    '工商银行',
    '建设银行',
    '农业银行',
    '招商银行',
    '交通银行',
    '民生银行',
    '兴业银行',
    '浦发银行',
    '中信银行'
  ]

  private addresses = [
    '上海市普陀区交通局888号',
    '北京市朝阳区建国门外大街1号',
    '深圳市南山区科技园南区',
    '杭州市西湖区文三路259号',
    '广州市天河区珠江新城',
    '成都市高新区天府大道',
    '武汉市洪山区光谷大道',
    '南京市鼓楼区中山路',
    '苏州市工业园区星海街',
    '重庆市渝北区龙溪街道'
  ]

  private logistics = [
    { name: '顺丰速运', code: 'SF' },
    { name: '圆通快递', code: 'YT' },
    { name: '中通快递', code: 'ZT' },
    { name: '申通快递', code: 'ST' },
    { name: '韵达快递', code: 'YD' },
    { name: '百世快递', code: 'BS' },
    { name: '德邦快递', code: 'DB' },
    { name: '京东物流', code: 'JD' }
  ]

  private names = [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
    '陈明', '刘华', '杨丽', '黄强', '朱敏', '林峰', '郭静', '何勇'
  ]

  // 生成随机字符串
  private generateRandomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
  }

  // 生成随机数字
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // 生成随机选择
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  // 生成随机日期
  private generateRandomDate(daysAgo: number = 30): string {
    const now = new Date()
    const randomDays = Math.floor(Math.random() * daysAgo)
    const randomHours = Math.floor(Math.random() * 24)
    const randomMinutes = Math.floor(Math.random() * 60)
    const randomSeconds = Math.floor(Math.random() * 60)
    
    const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000))
    date.setHours(randomHours, randomMinutes, randomSeconds)
    
    return date.toISOString().replace('T', ' ').substring(0, 19)
  }

  // 生成订单号
  private generateOrderNo(): string {
    return '1100' + Date.now().toString().slice(-8) + this.randomInt(10, 99)
  }

  // 生成税号
  private generateTaxNumber(): string {
    const prefixes = ['91310000', '91110000', '91440300', '91330100', '91440100']
    const prefix = this.randomChoice(prefixes)
    const suffix = this.generateRandomString(9, '0123456789') + this.randomChoice(['X', 'Y', 'Z', 'A', 'B'])
    return prefix + suffix
  }

  // 生成银行账号
  private generateBankAccount(): string {
    return '开户银行账号' + this.generateRandomString(9, '0123456789')
  }

  // 生成快递单号
  private generateExpressNo(logisticsCode: string): string {
    return logisticsCode + this.generateRandomString(13, '0123456789')
  }

  // 生成单个发票数据
  generateSingleInvoice(): InvoiceItem {
    const company = this.randomChoice(this.companies)
    const product = this.randomChoice(this.products)
    const bank = this.randomChoice(this.banks)
    const address = this.randomChoice(this.addresses)
    const logistics = this.randomChoice(this.logistics)
    const senderName = this.randomChoice(this.names)
    const orderNo = this.generateOrderNo()
    
    // 生成的发票都是待处理状态
    const status = 0 // 待处理
    const verifyTime = ''
    const rejectTime = ''
    const sellerRejectReason = ''
    const rejectReason = ''

    const applyTime = this.generateRandomDate(30)
    const orderTime = this.generateRandomDate(35)
    const uploadTime = this.generateRandomDate(25)

    return {
      invoice_title: company,
      seller_reject_reason: sellerRejectReason,
      verify_time: verifyTime,
      category_type: this.randomChoice([1, 2]), // 1=电子发票, 2=纸质发票
      order_time: orderTime,
      invoice_image_url: `https://example.com/invoice/img_${this.generateRandomString(6, '0123456789')}.jpg`,
      bank_name: bank,
      invoice_type: this.randomChoice([1, 2]), // 1=增值税普通发票, 2=增值税专用发票
      company_address: address,
      article_number: `${product.name}-${this.randomChoice(['黑色', '白色', '银色', '金色', '蓝色'])}`,
      bidding_price: product.price,
      spu_id: product.spu,
      invoice_title_type: this.randomChoice([1, 2]), // 1=个人, 2=企业
      spu_title: `【现货发售】${product.name} 全网通双卡双待5G手机`,
      bank_account: this.generateBankAccount(),
      status: status,
      upload_time: uploadTime,
      apply_time: applyTime,
      company_phone: `0${this.randomInt(10, 99)}-${this.randomInt(10000000, 99999999)}`,
      handle_flag: this.randomChoice([0, 1]),
      amount: product.price,
      seller_post: {
        express_no: this.generateExpressNo(logistics.code),
        take_end_time: this.generateRandomDate(-1), // 未来时间
        sender_name: senderName,
        take_start_time: this.generateRandomDate(-2), // 未来时间
        logistics_name: logistics.name,
        sender_full_address: address
      },
      sku_id: this.randomInt(10000, 99999),
      reject_time: rejectTime,
      order_no: orderNo,
      properties: this.randomChoice(['官方标配 128GB', '官方标配 256GB', '高配版 512GB', '标准版 64GB']),
      tax_number: this.generateTaxNumber(),
      reject_reason: rejectReason,
      seller_post_appointment: this.randomChoice([true, false])
    }
  }

  // 生成多个发票数据
  generateMultipleInvoices(count: number): InvoiceItem[] {
    const invoices: InvoiceItem[] = []
    for (let i = 0; i < count; i++) {
      invoices.push(this.generateSingleInvoice())
    }
    return invoices
  }
}

// 导出单例实例
export const invoiceGenerator = new InvoiceDataGenerator()

// 导出类型
export type { InvoiceItem }