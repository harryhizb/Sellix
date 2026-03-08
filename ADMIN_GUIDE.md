# Sellix Super Admin Dashboard - Quick Start Guide

## 🎯 What is This?

This is the **Super Admin Dashboard** for managing the ENTIRE Sellix SaaS platform. It allows you to:
- Monitor all businesses using Sellix
- View platform-wide analytics
- Manage system settings
- Suspend/reactivate businesses
- Monitor orders, feedback, and notifications across all businesses

## 📍 Accessing the Admin Dashboard

### URL
```
http://localhost:3000/admin
```

Or in production:
```
https://yourdomain.com/admin
```

### Authentication
Currently uses basic token-based auth (you should enhance this):
1. Login with admin credentials
2. Token stored in localStorage
3. Admin verification happens in `/admin/layout.tsx`

**TODO**: Implement proper role-based access control (RBAC)

## 📊 Features Implemented

### 1. Platform Overview (`/admin`)
- Total registered businesses
- Active WhatsApp connections
- Total orders processed
- Escalated cases count
- Average feedback rating
- Daily order trend graph
- System health monitoring (WhatsApp API status, server uptime)

### 2. Businesses Management (`/admin/businesses`)
- List all businesses with pagination
- Search by name or phone
- Filter by status (active/suspended)
- View business metrics (orders, products, customers)
- Actions:
  - Suspend/Reactivate business
  - Reset WhatsApp connection
  - View profile (coming soon)
  - View conversation logs (coming soon)

### 3. Orders Monitor (`/admin/orders`)
- Global order list across all businesses
- Filter by status (pending, confirmed, processing, shipped, delivered, cancelled)
- View order details
- Track payment methods
- Monitor order amounts

### 4. Conversations Monitor (`/admin/conversations`)
- Active conversations count
- Escalated to human count
- AI conversation analytics
- (Coming soon: Conversation list view)

### 5. Feedback & Ratings (`/admin/feedback`)
- Platform average rating
- Total feedback count
- Businesses rated
- Rating distribution
- (Coming soon: Individual feedback management)

### 6. Notifications Monitor (`/admin/notifications`)
- WhatsApp notification delivery status
- Failed notifications tracking
- Notification retry functionality
- Error monitoring

### 7. System Settings (`/admin/settings`)
- **System Configuration**
  - Maintenance mode toggle
  - Global message limit
  - Max products per business
  - Enable/disable new registrations

- **WhatsApp API Configuration**
  - API URL settings
  - Retry attempts
  - Timeout configuration

- **Feature Toggles**
  - E-commerce module
  - Service module
  - Institute module
  - Appointment booking
  - Course enrollment
  - Event management
  - FAQ system
  - AI chatbot
  - Human handoff
  - Feedback system
  - Analytics dashboard

## 🗂️ File Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx              # Admin layout with sidebar
│       ├── page.tsx                # Platform overview dashboard
│       ├── businesses/
│       │   └── page.tsx            # Businesses management
│       ├── orders/
│       │   └── page.tsx            # Orders monitor
│       ├── conversations/
│       │   └── page.tsx            # Conversations monitor
│       ├── feedback/
│       │   └── page.tsx            # Feedback & ratings
│       ├── notifications/
│       │   └── page.tsx            # Notifications monitor
│       └── settings/
│           └── page.tsx            # System settings
├── app/api/
│   └── admin/
│       ├── stats/
│       │   └── route.ts            # Platform statistics
│       ├── businesses/
│       │   └── route.ts            # Businesses CRUD
│       ├── orders/
│       │   └── route.ts            # Orders management
│       ├── feedback/
│       │   └── route.ts            # Feedback management
│       ├── notifications/
│       │   └── route.ts            # Notifications monitoring
│       └── settings/
│           └── route.ts            # System settings
└── models/
    ├── Feedback.ts                 # Feedback schema
    └── AdminSettings.ts            # Admin settings schema
```

## 🔐 Security Considerations

### Current Implementation
- Basic token verification
- Client-side admin check
- No role-based access control yet

### Recommended Improvements
1. **Implement RBAC** - Add admin/super_admin roles to User model
2. **Server-side verification** - Verify admin role on every API call
3. **Audit logging** - Log all admin actions
4. **Two-factor authentication** - For critical operations
5. **IP whitelisting** - Restrict admin access to specific IPs
6. **Session timeout** - Auto-logout after inactivity

## 📝 Database Models

### Feedback Model
- Business ID (reference)
- Customer ID (reference)
- Order ID (optional reference)
- Rating (1-5 stars)
- Comment (optional)
- Sentiment analysis
- Status (pending/reviewed/flagged/resolved)
- Admin notes

### AdminSettings Model (Singleton)
- System configuration
- WhatsApp API settings
- SMTP settings
- Feature toggles
- Rate limiting
- Security settings
- Notification preferences
- Analytics settings

## 🚀 Next Steps

### High Priority
1. **Add admin authentication** - Implement proper RBAC
2. **Business profile viewer** - Detailed business view
3. **Conversation logs viewer** - Read-only access to chats
4. **Export functionality** - CSV export for data
5. **Real-time updates** - WebSocket for live stats

### Medium Priority
1. **Advanced filtering** - More filter options
2. **Bulk actions** - Suspend multiple businesses
3. **Analytics dashboard** - Charts and graphs
4. **Email notifications** - Alert admins of issues
5. **Activity timeline** - Recent admin actions

### Low Priority
1. **Dark/Light theme** - UI customization
2. **Mobile responsive** - Better mobile view
3. **Keyboard shortcuts** - Power user features
4. **Custom reports** - Generate custom analytics

## ⚠️ Important Notes

1. **No Mock Data** - All data comes from real database queries
2. **Production Ready** - Uses actual aggregations and indexes
3. **Performance Optimized** - Pagination, indexing, efficient queries
4. **Separate from Business Dashboards** - Completely isolated system
5. **Platform-Wide** - Manages ALL businesses, not individual

## 🐛 Known Limitations

1. Toast notifications disabled (missing useToast hook)
2. Some views show placeholders (to be implemented)
3. No real-time updates yet (requires WebSocket integration)
4. Limited export functionality
5. No audit logging implemented

## 💡 Tips

- Use MongoDB Compass to verify data
- Check browser console for errors
- Test with sample businesses first
- Backup database before bulk operations
- Monitor server logs for API errors

---

**Built for:** Sellix SaaS Platform
**Version:** 1.0.0
**Last Updated:** March 4, 2026
