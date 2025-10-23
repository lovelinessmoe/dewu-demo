import { apiClient } from './apiClient'
import type { ApiResponse } from './apiClient'

export interface InvoiceListRequest {
  access_token: string
  page_no?: number
  page_size?: number
  spu_id?: number
  status?: number
  order_no?: string
  apply_start_time?: string
  apply_end_time?: string
  invoice_title_type?: number
}

export interface InvoiceHandleRequest {
  access_token: string
  order_no: string
  operation_type: 1 | 2 // 1=approve, 2=reject
  category_type: 1 | 2 // 1=electronic, 2=paper
  image_key?: string // required when operation_type=1
  reject_operation?: number // required when operation_type=2
}

export interface InvoiceListResponse {
  page_no: number
  page_size: number
  total_results: number
  list: InvoiceItem[]
}

export interface InvoiceItem {
  invoice_title: string
  seller_reject_reason: string
  verify_time: string
  category_type: number
  order_time: string
  invoice_image_url: string
  bank_name: string
  invoice_type: number
  company_address: string
  article_number: string
  bidding_price: number
  spu_id: number
  invoice_title_type: number
  spu_title: string
  bank_account: string
  status: number
  upload_time: string
  apply_time: string
  company_phone: string
  handle_flag: number
  amount: number
  seller_post: {
    express_no: string
    take_end_time: string
    sender_name: string
    take_start_time: string
    logistics_name: string
    sender_full_address: string
  }
  sku_id: number
  reject_time: string
  order_no: string
  properties: string
  tax_number: string
  reject_reason: string
  seller_post_appointment: boolean
}

class InvoiceService {
  /**
   * 获取发票列表
   */
  async getInvoiceList(params: InvoiceListRequest): Promise<ApiResponse<InvoiceListResponse>> {
    const requestData = {
      access_token: params.access_token,
      page_no: params.page_no || 1,
      page_size: params.page_size || 10,
      ...(params.spu_id && { spu_id: params.spu_id }),
      ...(params.status !== undefined && { status: params.status }),
      ...(params.order_no && { order_no: params.order_no }),
      ...(params.apply_start_time && { apply_start_time: params.apply_start_time }),
      ...(params.apply_end_time && { apply_end_time: params.apply_end_time }),
      ...(params.invoice_title_type !== undefined && { invoice_title_type: params.invoice_title_type })
    }

    return await apiClient.request<InvoiceListResponse>(
      'POST',
      '/dop/api/v1/invoice/list',
      requestData
    )
  }

  /**
   * 处理发票（批准/拒绝）
   */
  async handleInvoice(params: InvoiceHandleRequest): Promise<ApiResponse<{}>> {
    // 验证必需参数
    if (!params.access_token || !params.order_no || !params.operation_type || !params.category_type) {
      throw new Error('Missing required parameters')
    }

    // 验证操作类型特定参数
    if (params.operation_type === 1 && !params.image_key) {
      throw new Error('image_key is required when operation_type=1 (approve)')
    }

    if (params.operation_type === 2 && !params.reject_operation) {
      throw new Error('reject_operation is required when operation_type=2 (reject)')
    }

    const requestData = {
      access_token: params.access_token,
      order_no: params.order_no,
      operation_type: params.operation_type,
      category_type: params.category_type,
      ...(params.image_key && { image_key: params.image_key }),
      ...(params.reject_operation && { reject_operation: params.reject_operation })
    }

    return await apiClient.request<{}>(
      'POST',
      '/dop/api/v1/invoice/handle',
      requestData
    )
  }

  /**
   * 获取发票详情（如果后端支持）
   */
  async getInvoiceDetail(accessToken: string, orderNo: string): Promise<ApiResponse<InvoiceItem>> {
    // 通过列表接口获取特定发票
    const response = await this.getInvoiceList({
      access_token: accessToken,
      order_no: orderNo,
      page_no: 1,
      page_size: 1
    })

    if (response.code === 0 && response.data.list.length > 0) {
      return {
        ...response,
        data: response.data.list[0]
      }
    } else {
      throw new Error('Invoice not found')
    }
  }

  /**
   * 批量处理发票
   */
  async batchHandleInvoices(
    accessToken: string,
    orders: Array<{
      order_no: string
      operation_type: 1 | 2
      category_type: 1 | 2
      image_key?: string
      reject_operation?: number
    }>
  ): Promise<Array<{ order_no: string; success: boolean; error?: string }>> {
    const results = []

    for (const order of orders) {
      try {
        await this.handleInvoice({
          access_token: accessToken,
          ...order
        })
        results.push({ order_no: order.order_no, success: true })
      } catch (error) {
        results.push({
          order_no: order.order_no,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * 添加发票到后端
   */
  async addInvoices(accessToken: string, invoices: InvoiceItem[]): Promise<ApiResponse<{ added_count: number }>> {
    const requestData = {
      access_token: accessToken,
      invoices: invoices
    }

    return await apiClient.request<{ added_count: number }>(
      'POST',
      '/dop/api/v1/invoice/add',
      requestData
    )
  }

  /**
   * 更新发票信息
   */
  async updateInvoice(accessToken: string, orderNo: string, invoiceData: Partial<InvoiceItem>): Promise<ApiResponse<{}>> {
    const requestData = {
      access_token: accessToken,
      order_no: orderNo,
      invoice_data: invoiceData
    }

    return await apiClient.request<{}>(
      'POST',
      '/dop/api/v1/invoice/update',
      requestData
    )
  }

  /**
   * 获取发票统计信息
   */
  async getInvoiceStats(accessToken: string): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    // 获取所有发票数据进行统计
    const response = await this.getInvoiceList({
      access_token: accessToken,
      page_no: 1,
      page_size: 1000 // 获取大量数据进行统计
    })

    if (response.code === 0) {
      const invoices = response.data.list
      return {
        total: invoices.length,
        pending: invoices.filter(inv => inv.status === 0).length,
        approved: invoices.filter(inv => inv.status === 2).length,
        rejected: invoices.filter(inv => inv.status === 3 || inv.status === 5).length
      }
    }

    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }
}

// 创建单例实例
export const invoiceService = new InvoiceService()

// Types are already exported above as interfaces