-- Dewu Mock API - Supabase Table Setup
-- Run this SQL in your Supabase SQL Editor

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_title TEXT NOT NULL,
    seller_reject_reason TEXT DEFAULT '',
    verify_time TEXT DEFAULT '',
    category_type INTEGER NOT NULL,
    order_time TEXT NOT NULL,
    invoice_image_url TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    invoice_type INTEGER NOT NULL,
    company_address TEXT DEFAULT '',
    article_number TEXT DEFAULT '',
    bidding_price INTEGER DEFAULT 0,
    spu_id INTEGER NOT NULL,
    invoice_title_type INTEGER NOT NULL,
    spu_title TEXT DEFAULT '',
    bank_account TEXT DEFAULT '',
    status INTEGER NOT NULL DEFAULT 0,
    upload_time TEXT DEFAULT '',
    apply_time TEXT NOT NULL,
    company_phone TEXT DEFAULT '',
    handle_flag INTEGER DEFAULT 0,
    amount INTEGER DEFAULT 0,
    seller_post JSONB DEFAULT '{}',
    sku_id INTEGER DEFAULT 0,
    reject_time TEXT DEFAULT '',
    order_no TEXT UNIQUE NOT NULL,
    properties TEXT DEFAULT '',
    tax_number TEXT DEFAULT '',
    reject_reason TEXT DEFAULT '',
    seller_post_appointment BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_spu_id ON invoices(spu_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_no ON invoices(order_no);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_title_type ON invoices(invoice_title_type);
CREATE INDEX IF NOT EXISTS idx_invoices_apply_time ON invoices(apply_time);

-- Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- In production, you should create more restrictive policies
CREATE POLICY "Allow all operations on invoices" ON invoices
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO invoices (
    invoice_title, seller_reject_reason, verify_time, category_type, order_time,
    invoice_image_url, bank_name, invoice_type, company_address, article_number,
    bidding_price, spu_id, invoice_title_type, spu_title, bank_account,
    status, upload_time, apply_time, company_phone, handle_flag,
    amount, seller_post, sku_id, reject_time, order_no,
    properties, tax_number, reject_reason, seller_post_appointment
) VALUES 
(
    '得物科技有限公司', '', '2024-10-15 14:30:25', 1, '2024-10-10 09:15:30',
    'https://example.com/invoice/img_001.jpg', '中国银行', 1, '上海市普陀区交通局888号', 'iPhone 14-黑色',
    25900, 12345, 2, '【现货发售】Apple iPhone 14 黑色 全网通双卡双待5G手机', '开户银行账号123456789',
    0, '2024-10-12 16:20:15', '2024-10-11 10:45:20', '021-88888888', 1,
    25900, '{"express_no": "SF1301946631496", "take_end_time": "2024-10-16 11:00:00", "sender_name": "张三", "take_start_time": "2024-10-16 10:00:00", "logistics_name": "顺丰速运", "sender_full_address": "上海市普陀区交通局888号"}', 67890, '', '11001232435',
    '官方标配 128GB', '91310000123456789X', '', false
),
(
    '上海潮流科技', '查询不到公司税号', '2024-10-14 11:25:30', 2, '2024-10-08 14:20:15',
    'https://example.com/invoice/img_002.jpg', '工商银行', 2, '北京市朝阳区建国门外大街1号', 'iPhone 13-白色',
    18900, 23456, 1, '【现货发售】Apple iPhone 13 白色 全网通双卡双待5G手机', '开户银行账号987654321',
    5, '2024-10-09 13:15:45', '2024-10-08 15:30:10', '010-66666666', 0,
    18900, '{"express_no": "YT2301946631497", "take_end_time": "2024-10-15 15:00:00", "sender_name": "李四", "take_start_time": "2024-10-15 14:00:00", "logistics_name": "圆通快递", "sender_full_address": "北京市朝阳区建国门外大街1号"}', 78901, '2024-10-14 11:25:30', '11001232436',
    '官方标配 256GB', '91110000234567890Y', '查询不到公司税号', true
),
(
    '深圳创新企业', '', '2024-10-13 16:45:20', 1, '2024-10-05 11:30:25',
    'https://example.com/invoice/img_003.jpg', '建设银行', 1, '深圳市南山区科技园南区', 'MacBook Pro-银色',
    45000, 34567, 2, '【现货发售】Apple MacBook Pro 银色 M2芯片笔记本电脑', '开户银行账号456789123',
    2, '2024-10-06 09:20:30', '2024-10-05 12:15:40', '0755-77777777', 1,
    45000, '{"express_no": "ZT3301946631498", "take_end_time": "2024-10-14 12:00:00", "sender_name": "王五", "take_start_time": "2024-10-14 11:00:00", "logistics_name": "中通快递", "sender_full_address": "深圳市南山区科技园南区"}', 89012, '', '11001232437',
    '高配版 512GB', '91440300345678901Z', '', false
),
(
    '杭州电商公司', '', '', 1, '2024-10-12 08:45:15',
    'https://example.com/invoice/img_004.jpg', '农业银行', 1, '杭州市西湖区文三路259号', 'iPad Air-玫瑰金',
    12800, 45678, 1, '【现货发售】Apple iPad Air 玫瑰金 平板电脑', '开户银行账号789123456',
    0, '2024-10-13 10:30:20', '2024-10-12 09:20:35', '0571-55555555', 1,
    12800, '{"express_no": "ST4301946631499", "take_end_time": "2024-10-17 13:00:00", "sender_name": "赵六", "take_start_time": "2024-10-17 12:00:00", "logistics_name": "申通快递", "sender_full_address": "杭州市西湖区文三路259号"}', 90123, '', '11001232438',
    '标准版 64GB', '91330100456789012A', '', true
),
(
    '广州数字科技', '发票信息不完整', '2024-10-11 14:20:10', 2, '2024-10-03 16:15:25',
    'https://example.com/invoice/img_005.jpg', '招商银行', 2, '广州市天河区珠江新城', 'AirPods Pro-白色',
    3200, 56789, 2, '【现货发售】Apple AirPods Pro 白色 无线蓝牙耳机', '开户银行账号321654987',
    3, '2024-10-04 11:45:30', '2024-10-03 17:30:15', '020-44444444', 0,
    3200, '{"express_no": "YD5301946631500", "take_end_time": "2024-10-12 14:00:00", "sender_name": "钱七", "take_start_time": "2024-10-12 13:00:00", "logistics_name": "韵达快递", "sender_full_address": "广州市天河区珠江新城"}', 12340, '2024-10-11 14:20:10', '11001232439',
    '官方标配', '91440100567890123B', '发票信息不完整', false
)
ON CONFLICT (order_no) DO NOTHING;

-- Verify the setup
SELECT 
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN status = 0 THEN 1 END) as pending_invoices,
    COUNT(CASE WHEN status = 2 THEN 1 END) as approved_invoices,
    COUNT(CASE WHEN status = 5 THEN 1 END) as rejected_invoices
FROM invoices;