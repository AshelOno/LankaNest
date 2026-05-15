import Sidebar from '@/components/admin_dashboard/Sidebar'
import React, { useState, useEffect } from 'react'
import { Table, Tag, Select, Input, Button, Space, Rate, Dropdown, Menu, notification, Card, Statistic, Row, Col, Badge } from 'antd'
import { MessageSquare, Filter, MoreHorizontal, CheckCircle, AlertCircle, HelpCircle, Star } from 'lucide-react'
import { SearchOutlined } from '@ant-design/icons'
import { api } from "@/services/http"

const { Option } = Select

const Feedback = () => {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState(null)
  const [filterUserType, setFilterUserType] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    addressed: 0,
    suggestions: 0,
    bugs: 0,
    compliments: 0,
    avgRating: 0
  })

  useEffect(() => {
    fetchFeedback()
    document.title = "User Feedback Management"
  }, [])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const response = await api.get('/feedback/all')

      if (response.data.success) {
        setFeedback(response.data.data)
        calculateStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      notification.error({
        message: 'Error',
        description: 'Failed to load feedback data'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (feedbackData) => {
    if (!feedbackData || feedbackData.length === 0) return

    const total = feedbackData.length
    const pending = feedbackData.filter(f => f.status === 'pending').length
    const addressed = feedbackData.filter(f => f.status === 'addressed' || f.status === 'closed').length
    const suggestions = feedbackData.filter(f => f.feedbackType === 'suggestion').length
    const bugs = feedbackData.filter(f => f.feedbackType === 'bug').length
    const compliments = feedbackData.filter(f => f.feedbackType === 'compliment').length
    
    // Calculate average rating (excluding zero ratings)
    const validRatings = feedbackData.filter(f => f.rating > 0)
    const avgRating = validRatings.length > 0 
      ? validRatings.reduce((sum, item) => sum + item.rating, 0) / validRatings.length 
      : 0

    setStats({
      total,
      pending,
      addressed,
      suggestions,
      bugs,
      compliments,
      avgRating: avgRating.toFixed(1)
    })
  }

  const updateFeedbackStatus = async (id, status) => {
    try {
      const response = await api.patch(`/feedback/${id}/status`, 
        { status, isResolved: status === 'closed' || status === 'addressed' }
      )

      if (response.data.success) {
        notification.success({
          message: 'Status Updated',
          description: `Feedback status changed to ${status}`
        })
        
        // Update the local state
        setFeedback(prevFeedback => 
          prevFeedback.map(item => 
            item._id === id 
              ? { ...item, status, isResolved: status === 'closed' || status === 'addressed' } 
              : item
          )
        )
        
        // Recalculate stats
        calculateStats(feedback.map(item => 
          item._id === id 
            ? { ...item, status, isResolved: status === 'closed' || status === 'addressed' } 
            : item
        ))
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update feedback status'
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'reviewed': return 'blue'
      case 'addressed': return 'green'
      case 'closed': return 'gray'
      default: return 'default'
    }
  }

  const getFeedbackTypeIcon = (type) => {
    switch (type) {
      case 'suggestion': return <HelpCircle className="h-4 w-4 text-blue-500" />
      case 'bug': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'compliment': return <Star className="h-4 w-4 text-yellow-500" />
      case 'other': return <MessageSquare className="h-4 w-4 text-purple-500" />
      default: return null
    }
  }

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'student': return 'blue'
      case 'landlord': return 'purple'
      case 'admin': return 'red'
      case 'anonymous': return 'gray'
      default: return 'default'
    }
  }

  const actionMenu = (record) => (
    <Menu>
      <Menu.Item key="1" onClick={() => updateFeedbackStatus(record._id, 'reviewed')}>
        Mark as Reviewed
      </Menu.Item>
      <Menu.Item key="2" onClick={() => updateFeedbackStatus(record._id, 'addressed')}>
        Mark as Addressed
      </Menu.Item>
      <Menu.Item key="3" onClick={() => updateFeedbackStatus(record._id, 'closed')}>
        Close Feedback
      </Menu.Item>
    </Menu>
  )

  const clearFilters = () => {
    setFilterType(null)
    setFilterUserType(null)
    setFilterStatus(null)
    setSearchText('')
  }

  const columns = [
    {
      title: 'Feedback Type',
      dataIndex: 'feedbackType',
      key: 'feedbackType',
      render: (type) => (
        <Space>
          {getFeedbackTypeIcon(type)}
          <span className="capitalize">{type}</span>
        </Space>
      ),
      filters: [
        { text: 'Suggestion', value: 'suggestion' },
        { text: 'Bug Report', value: 'bug' },
        { text: 'Compliment', value: 'compliment' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.feedbackType === value,
      filteredValue: filterType ? [filterType] : null,
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType) => (
        <Tag color={getUserTypeColor(userType)} className="capitalize">
          {userType}
        </Tag>
      ),
      filters: [
        { text: 'Student', value: 'student' },
        { text: 'Landlord', value: 'landlord' },
        { text: 'Admin', value: 'admin' },
        { text: 'Anonymous', value: 'anonymous' },
      ],
      onFilter: (value, record) => record.userType === value,
      filteredValue: filterUserType ? [filterUserType] : null,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => rating > 0 ? <Rate disabled defaultValue={rating} /> : 'No rating',
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (text) => (
        <div className="max-h-24 overflow-y-auto">{text}</div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.feedback.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Reviewed', value: 'reviewed' },
        { text: 'Addressed', value: 'addressed' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
      filteredValue: filterStatus ? [filterStatus] : null,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown overlay={actionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreHorizontal className="h-4 w-4" />} />
        </Dropdown>
      ),
    },
  ]

  const handleFilterChange = (type, value) => {
    switch (type) {
      case 'feedbackType':
        setFilterType(value)
        break
      case 'userType':
        setFilterUserType(value)
        break
      case 'status':
        setFilterStatus(value)
        break
      default:
        break
    }
  }

  return (
    <div className="ln-dashboard-bg min-h-screen">
      <Sidebar />

      <div className="ln-dashboard-main">
        <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="ln-admin-page-title">
          <div>
            <h1 className="flex items-center text-2xl font-bold text-gray-800">
              <MessageSquare className="mr-3 text-emerald-700" />
              User Feedback
            </h1>
            <p className="text-sm text-gray-600">Review marketplace feedback, trends, and resolution status.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card bordered={false}>
              <Statistic 
                title="Total Feedback" 
                value={stats.total} 
                valueStyle={{ color: '#0A4174' }}
                prefix={<MessageSquare className="h-4 w-4" />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card bordered={false}>
              <Statistic 
                title="Pending" 
                value={stats.pending} 
                valueStyle={{ color: '#faad14' }}
                prefix={<Badge status="warning" />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card bordered={false}>
              <Statistic 
                title="Addressed" 
                value={stats.addressed} 
                valueStyle={{ color: '#0f8b6f' }}
                prefix={<CheckCircle className="h-4 w-4" />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card bordered={false}>
              <Statistic 
                title="Average Rating" 
                value={stats.avgRating} 
                valueStyle={{ color: '#fadb14' }}
                prefix={<Star className="h-4 w-4" />} 
                suffix="/ 5"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div className="ln-admin-panel">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700 font-medium">Filters:</span>
            </div>
            
            <Select
              placeholder="Filter by Type"
              allowClear
              style={{ width: 180 }}
              onChange={(value) => handleFilterChange('feedbackType', value)}
              value={filterType}
            >
              <Option value="suggestion">Suggestion</Option>
              <Option value="bug">Bug Report</Option>
              <Option value="compliment">Compliment</Option>
              <Option value="other">Other</Option>
            </Select>
            
            <Select
              placeholder="Filter by User Type"
              allowClear
              style={{ width: 180 }}
              onChange={(value) => handleFilterChange('userType', value)}
              value={filterUserType}
            >
              <Option value="student">Student</Option>
              <Option value="landlord">Landlord</Option>
              <Option value="admin">Admin</Option>
              <Option value="anonymous">Anonymous</Option>
            </Select>
            
            <Select
              placeholder="Filter by Status"
              allowClear
              style={{ width: 180 }}
              onChange={(value) => handleFilterChange('status', value)}
              value={filterStatus}
            >
              <Option value="pending">Pending</Option>
              <Option value="reviewed">Reviewed</Option>
              <Option value="addressed">Addressed</Option>
              <Option value="closed">Closed</Option>
            </Select>
            
            <Input
              placeholder="Search feedback text"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            
            <Button type="default" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Table
            dataSource={feedback}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            onChange={(pagination, filters) => {
              setFilterType(filters.feedbackType ? filters.feedbackType[0] : null)
              setFilterUserType(filters.userType ? filters.userType[0] : null)
              setFilterStatus(filters.status ? filters.status[0] : null)
            }}
          />
        </div>
        </div>
      </div>
    </div>
  )
}

export default Feedback
