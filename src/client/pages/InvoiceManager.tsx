import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import * as InvoiceServiceModule from '../services/invoiceService'
const { invoiceService } = InvoiceServiceModule
type InvoiceItem = InvoiceServiceModule.InvoiceItem
import { invoiceGenerator } from '../utils/invoiceGenerator'
import ErrorDisplay from '../components/ErrorDisplay'

import type { ApiError } from '../services/apiClient'

interface InvoiceManagerState {
  invoices: InvoiceItem[]
  loading: boolean
  error: ApiError | null
  editingInvoice: InvoiceItem | null
  showEditModal: boolean
  showAddModal: boolean
  generateCount: number
}

const InvoiceManager: React.FC = () => {
  const { getAccessToken } = useAuth()
  const token = getAccessToken()
  const [state, setState] = useState<InvoiceManagerState>({
    invoices: [],
    loading: true,
    error: null,
    editingInvoice: null,
    showEditModal: false,
    showAddModal: false,
    generateCount: 5
  })

  // Helper function to get user-friendly error messages
  const getErrorMessage = (status: number, originalMessage: string): string => {
    switch (status) {
      case 503:
        return '服务暂时不可用，数据库连接失败。请稍后重试。'
      case 500:
        return '数据库错误，处理请求时出现问题。请重试或联系技术支持。'
      case 404:
        return '未找到发票，请求的发票在系统中不存在。'
      case 0:
        return '网络连接失败，请检查网络连接后重试。'
      case 401:
        return '需要重新登录，请重新获取访问令牌。'
      case 403:
        return '访问被拒绝，您没有执行此操作的权限。'
      default:
        return originalMessage || '发生未知错误，请重试。'
    }
  }

  // 加载发票数据
  const loadInvoices = async () => {
    if (!token) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await invoiceService.getInvoiceList({
        access_token: token,
        page_no: 1,
        page_size: 100 // 加载所有数据
      })

      if (response.code === 0) {
        // Preserve backend sort order - invoices are already sorted by upload_time DESC
        setState(prev => ({
          ...prev,
          invoices: response.data.list,
          loading: false
        }))
      } else {
        // Handle API response errors
        const apiError: ApiError = {
          code: response.code,
          msg: response.msg || '加载发票数据失败',
          status: response.status || 500,
          data: response.data
        }
        setState(prev => ({
          ...prev,
          error: apiError,
          loading: false
        }))
      }
    } catch (error) {
      // Handle network and other errors
      const apiError = error as ApiError
      setState(prev => ({
        ...prev,
        error: apiError,
        loading: false
      }))
    }
  }

  // 处理发票（批准/拒绝）
  const handleInvoice = async (orderNo: string, operationType: 1 | 2, rejectReason?: number) => {
    if (!token) return

    try {
      const requestData: any = {
        access_token: token,
        order_no: orderNo,
        operation_type: operationType,
        category_type: 1
      }

      if (operationType === 1) {
        requestData.image_key = 'admin_approval_' + Date.now()
      } else if (operationType === 2 && rejectReason) {
        requestData.reject_operation = rejectReason
      }

      const response = await invoiceService.handleInvoice(requestData)

      if (response.code === 200) {
        // 重新加载数据
        await loadInvoices()
        alert(operationType === 1 ? '发票已批准' : '发票已拒绝')
      } else {
        // Handle API response errors with user-friendly messages
        const errorMsg = getErrorMessage(response.status || 500, response.msg)
        alert('操作失败: ' + errorMsg)
      }
    } catch (error) {
      // Handle network and other errors
      const apiError = error as ApiError
      const errorMsg = getErrorMessage(apiError.status, apiError.msg)
      alert('操作失败: ' + errorMsg)
    }
  }

  // 打开编辑模态框
  const openEditModal = (invoice: InvoiceItem) => {
    setState(prev => ({
      ...prev,
      editingInvoice: { ...invoice },
      showEditModal: true
    }))
  }

  // 关闭编辑模态框
  const closeEditModal = () => {
    setState(prev => ({
      ...prev,
      editingInvoice: null,
      showEditModal: false
    }))
  }

  // 更新编辑中的发票数据
  const updateEditingInvoice = (field: keyof InvoiceItem, value: any) => {
    setState(prev => ({
      ...prev,
      editingInvoice: prev.editingInvoice ? {
        ...prev.editingInvoice,
        [field]: value
      } : null
    }))
  }

  // 保存编辑
  const saveEdit = async () => {
    if (!state.editingInvoice || !token) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      // 调用后端 API 更新发票
      const response = await invoiceService.updateInvoice(
        token,
        state.editingInvoice.order_no,
        state.editingInvoice
      )

      if (response.code === 200) {
        // 成功更新到后端，重新加载数据
        await loadInvoices()
        setState(prev => ({
          ...prev,
          showEditModal: false,
          editingInvoice: null,
          loading: false
        }))
        alert('发票信息已成功更新到后端！')
      } else {
        // 后端更新失败，显示用户友好的错误信息
        const errorMsg = getErrorMessage(response.status || 500, response.msg)
        setState(prev => ({
          ...prev,
          invoices: prev.invoices.map(invoice =>
            invoice.order_no === prev.editingInvoice?.order_no
              ? prev.editingInvoice
              : invoice
          ),
          showEditModal: false,
          editingInvoice: null,
          loading: false
        }))
        alert(`后端更新失败，数据仅在前端显示：${errorMsg}`)
      }
    } catch (error) {
      // API 调用失败，显示用户友好的错误信息
      const apiError = error as ApiError
      const errorMsg = getErrorMessage(apiError.status, apiError.msg)
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(invoice =>
          invoice.order_no === prev.editingInvoice?.order_no
            ? prev.editingInvoice
            : invoice
        ),
        showEditModal: false,
        editingInvoice: null,
        loading: false
      }))
      alert(`API 调用失败，数据仅在前端显示。错误：${errorMsg}`)
    }
  }

  // 打开添加发票模态框
  const openAddModal = () => {
    setState(prev => ({
      ...prev,
      showAddModal: true
    }))
  }

  // 关闭添加发票模态框
  const closeAddModal = () => {
    setState(prev => ({
      ...prev,
      showAddModal: false
    }))
  }

  // 更新生成数量
  const updateGenerateCount = (count: number) => {
    setState(prev => ({
      ...prev,
      generateCount: Math.max(1, Math.min(50, count)) // 限制在 1-50 之间
    }))
  }

  // 生成随机发票数据
  const generateRandomInvoices = async () => {
    if (!token) return

    try {
      setState(prev => ({ ...prev, loading: true }))

      const newInvoices = invoiceGenerator.generateMultipleInvoices(state.generateCount)

      // 调用后端 API 添加发票
      const response = await invoiceService.addInvoices(token, newInvoices)

      if (response.code === 200) {
        // 成功添加到后端，重新加载数据
        await loadInvoices()
        setState(prev => ({ ...prev, showAddModal: false, loading: false }))
        alert(`成功生成并添加 ${state.generateCount} 条发票数据到后端！`)
      } else {
        // 后端添加失败，显示用户友好的错误信息
        const errorMsg = getErrorMessage(response.status || 500, response.msg)
        setState(prev => ({
          ...prev,
          invoices: [...newInvoices, ...prev.invoices],
          showAddModal: false,
          loading: false
        }))
        alert(`后端添加失败，数据仅在前端显示：${errorMsg}`)
      }
    } catch (error) {
      // API 调用失败，显示用户友好的错误信息
      const apiError = error as ApiError
      const errorMsg = getErrorMessage(apiError.status, apiError.msg)
      const newInvoices = invoiceGenerator.generateMultipleInvoices(state.generateCount)
      setState(prev => ({
        ...prev,
        invoices: [...newInvoices, ...prev.invoices],
        showAddModal: false,
        loading: false
      }))
      alert(`API 调用失败，数据仅在前端显示。错误：${errorMsg}`)
    }
  }

  // 获取状态文本
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: '待处理',
      2: '审核通过',
      3: '已驳回',
      5: '卖家已驳回'
    }
    return statusMap[status] || '未知状态'
  }

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    const colorMap: Record<number, string> = {
      0: 'bg-yellow-100 text-yellow-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800',
      5: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  useEffect(() => {
    loadInvoices()
  }, [token])

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">发票管理</h1>
          <p className="text-gray-600">请先在测试页面获取访问令牌</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">发票管理</h1>
        <p className="mt-2 text-gray-600">管理和处理发票申请</p>
      </div>

      {state.loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      )}

      {state.error && (
        <ErrorDisplay
          error={state.error}
          onRetry={loadInvoices}
          onDismiss={() => setState(prev => ({ ...prev, error: null }))}
        />
      )}

      {!state.loading && !state.error && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                发票列表 ({state.invoices.length} 条记录)
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={openAddModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  + 添加发票
                </button>
                <button
                  onClick={loadInvoices}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  刷新
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      订单号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发票抬头
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Display invoices in backend sort order (upload_time DESC) */}
                  {state.invoices.map((invoice) => (
                    <tr key={invoice.order_no} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.order_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{invoice.article_number}</div>
                          <div className="text-xs text-gray-400">{invoice.properties}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{invoice.invoice_title}</div>
                          <div className="text-xs text-gray-400">
                            {invoice.invoice_title_type === 1 ? '个人' : '企业'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ¥{(invoice.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.apply_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          编辑
                        </button>
                        {invoice.status === 0 && (
                          <>
                            <button
                              onClick={() => handleInvoice(invoice.order_no, 1)}
                              className="text-green-600 hover:text-green-900"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleInvoice(invoice.order_no, 2, 104)}
                              className="text-red-600 hover:text-red-900"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {state.showEditModal && state.editingInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                编辑发票信息 - {state.editingInvoice.order_no}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">发票抬头</label>
                  <input
                    type="text"
                    value={state.editingInvoice.invoice_title}
                    onChange={(e) => updateEditingInvoice('invoice_title', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">公司地址</label>
                  <input
                    type="text"
                    value={state.editingInvoice.company_address}
                    onChange={(e) => updateEditingInvoice('company_address', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">公司电话</label>
                  <input
                    type="text"
                    value={state.editingInvoice.company_phone}
                    onChange={(e) => updateEditingInvoice('company_phone', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">税号</label>
                  <input
                    type="text"
                    value={state.editingInvoice.tax_number}
                    onChange={(e) => updateEditingInvoice('tax_number', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">银行名称</label>
                  <input
                    type="text"
                    value={state.editingInvoice.bank_name}
                    onChange={(e) => updateEditingInvoice('bank_name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">银行账号</label>
                  <input
                    type="text"
                    value={state.editingInvoice.bank_account}
                    onChange={(e) => updateEditingInvoice('bank_account', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select
                    value={state.editingInvoice.status}
                    onChange={(e) => updateEditingInvoice('status', parseInt(e.target.value))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>待处理</option>
                    <option value={2}>审核通过</option>
                    <option value={3}>已驳回</option>
                    <option value={5}>卖家已驳回</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加发票模态框 */}
      {state.showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                生成随机发票数据
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={state.generateCount}
                    onChange={(e) => updateGenerateCount(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="请输入要生成的发票数量"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    可生成 1-50 条随机发票数据
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">生成的数据包含：</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 随机公司名称和地址</li>
                    <li>• 随机商品信息（iPhone、MacBook等）</li>
                    <li>• 所有发票都是待处理状态</li>
                    <li>• 完整的物流和银行信息</li>
                    <li>• 符合真实格式的订单号和税号</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeAddModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={generateRandomInvoices}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  生成 {state.generateCount} 条发票
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceManager