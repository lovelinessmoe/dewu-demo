export interface ApiEndpoint {
  id: string
  title: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  category: string
  requiresAuth: boolean
  requestFormat: {
    contentType: string
    parameters: ApiParameter[]
  }
  responseFormat: {
    success: any
    error: any
  }
  examples: {
    request: any
    response: any
  }
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
}

export interface ApiCategory {
  id: string
  name: string
  description: string
  endpoints: string[]
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