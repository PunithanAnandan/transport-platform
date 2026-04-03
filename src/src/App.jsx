import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Eye, EyeOff, LogOut, Download, Calendar, TrendingUp, DollarSign, Truck, AlertCircle } from 'lucide-react';

const TransportPlatform = () => {
  // ============= STATE MANAGEMENT =============
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingTrip, setEditingTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Default form data
  const defaultFormData = {
    tripId: '',
    date: new Date().toISOString().slice(0, 10),
    route: '',
    fromCity: '',
    toCity: '',
    truck: '',
    driver: '',
    revenueAmount: '',
    advanceAmount: '',
    brokerName: '',
    brokerCommission: '',
    fuel: '',
    toll: '',
    loading: '',
    maintenance: '',
    permits: '',
    cargo: '',
    clientName: '',
    status: 'In Progress'
  };

  const [formData, setFormData] = useState(defaultFormData);

  // ============= AUTHENTICATION =============
  const handleLogin = (email, password) => {
    if (email && password) {
      setCurrentUser({ email, name: email.split('@')[0] });
      setShowLogin(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setActiveTab('dashboard');
    setShowForm(false);
  };

  // ============= TRIP MANAGEMENT =============
  const handleAddTrip = () => {
    const newTrip = {
      id: Date.now().toString(),
      ...formData,
      revenueAmount: parseFloat(formData.revenueAmount) || 0,
      advanceAmount: parseFloat(formData.advanceAmount) || 0,
      brokerCommission: parseFloat(formData.brokerCommission) || 0,
      fuel: parseFloat(formData.fuel) || 0,
      toll: parseFloat(formData.toll) || 0,
      loading: parseFloat(formData.loading) || 0,
      maintenance: parseFloat(formData.maintenance) || 0,
      permits: parseFloat(formData.permits) || 0,
      createdBy: currentUser.email,
      createdAt: new Date().toISOString()
    };

    if (editingTrip) {
      setTrips(trips.map(t => t.id === editingTrip.id ? { ...newTrip, id: editingTrip.id, createdAt: editingTrip.createdAt } : t));
      setEditingTrip(null);
    } else {
      setTrips([...trips, newTrip]);
    }

    setFormData(defaultFormData);
    setShowForm(false);
  };

  const handleEditTrip = (trip) => {
    setFormData(trip);
    setEditingTrip(trip);
    setShowForm(true);
  };

  const handleDeleteTrip = (id) => {
    setTrips(trips.filter(t => t.id !== id));
  };

  // ============= CALCULATIONS =============
  const calculateTripProfit = (trip) => {
    const totalExpenses = 
      (trip.brokerCommission || 0) + 
      (trip.fuel || 0) + 
      (trip.toll || 0) + 
      (trip.loading || 0) + 
      (trip.maintenance || 0) + 
      (trip.permits || 0);
    
    // Driver salary is 15% of revenue
    const driverSalary = (trip.revenueAmount || 0) * 0.15;
    
    const totalCosts = totalExpenses + driverSalary;
    return (trip.revenueAmount || 0) - totalCosts;
  };

  const calculatePendingPayment = (trip) => {
    return (trip.revenueAmount || 0) - (trip.advanceAmount || 0);
  };

  const filterTripsByMonth = (month) => {
    return trips.filter(trip => trip.date.startsWith(month));
  };

  const getMonthlyStats = (month) => {
    const monthTrips = filterTripsByMonth(month);
    
    const totalRevenue = monthTrips.reduce((sum, t) => sum + (t.revenueAmount || 0), 0);
    const totalExpenses = monthTrips.reduce((sum, t) => {
      const tripExp = (t.brokerCommission || 0) + (t.fuel || 0) + (t.toll || 0) + 
                      (t.loading || 0) + (t.maintenance || 0) + (t.permits || 0);
      const driverSalary = (t.revenueAmount || 0) * 0.15;
      return sum + tripExp + driverSalary;
    }, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const totalAdvance = monthTrips.reduce((sum, t) => sum + (t.advanceAmount || 0), 0);
    const totalPending = monthTrips.reduce((sum, t) => sum + calculatePendingPayment(t), 0);

    return { totalRevenue, totalExpenses, totalProfit, totalAdvance, totalPending, tripCount: monthTrips.length };
  };

  const getTruckStats = () => {
    const truckMap = {};
    trips.forEach(trip => {
      if (!truckMap[trip.truck]) {
        truckMap[trip.truck] = { trips: 0, revenue: 0, profit: 0 };
      }
      truckMap[trip.truck].trips++;
      truckMap[trip.truck].revenue += trip.revenueAmount || 0;
      truckMap[trip.truck].profit += calculateTripProfit(trip);
    });
    return truckMap;
  };

  const getRouteStats = () => {
    const routeMap = {};
    trips.forEach(trip => {
      const route = `${trip.fromCity}-${trip.toCity}`;
      if (!routeMap[route]) {
        routeMap[route] = { trips: 0, revenue: 0, profit: 0 };
      }
      routeMap[route].trips++;
      routeMap[route].revenue += trip.revenueAmount || 0;
      routeMap[route].profit += calculateTripProfit(trip);
    });
    return routeMap;
  };

  const getDriverStats = () => {
    const driverMap = {};
    trips.forEach(trip => {
      if (!driverMap[trip.driver]) {
        driverMap[trip.driver] = { trips: 0, earnings: 0 };
      }
      driverMap[trip.driver].trips++;
      driverMap[trip.driver].earnings += (trip.revenueAmount || 0) * 0.15;
    });
    return driverMap;
  };

  // ============= EXPORT FUNCTIONS =============
  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => {
      const val = row[h];
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
    }).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const monthlyStats = getMonthlyStats(selectedMonth);

  // ============= RENDER: LOGIN SCREEN =============
  if (showLogin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '28px' }}>
            🚚 TransportHub
          </h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            Manage your fleet expenses and profitability
          </p>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // ============= RENDER: MAIN APP =============
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e7ff',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🚚</div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: '600' }}>TransportHub</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#666', fontSize: '14px' }}>👤 {currentUser.name}</span>
          <button
            onClick={handleLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '2px solid #e0e7ff',
        paddingLeft: '30px',
        display: 'flex',
        gap: '0'
      }}>
        {['dashboard', 'trips', 'routes', 'trucks', 'drivers', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#667eea' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              border: 'none',
              padding: '15px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              borderBottom: activeTab === tab ? '3px solid #667eea' : 'none',
              transition: 'all 0.3s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && <Dashboard 
          monthlyStats={monthlyStats}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          tripsCount={trips.length}
          routeStats={getRouteStats()}
        />}

        {/* ========== TRIPS TAB ========== */}
        {activeTab === 'trips' && <TripsTab 
          showForm={showForm}
          setShowForm={setShowForm}
          formData={formData}
          setFormData={setFormData}
          onAddTrip={handleAddTrip}
          trips={trips}
          onEdit={handleEditTrip}
          onDelete={handleDeleteTrip}
          calculateProfit={calculateTripProfit}
          calculatePending={calculatePendingPayment}
          editingTrip={editingTrip}
          onCancel={() => { setShowForm(false); setFormData(defaultFormData); setEditingTrip(null); }}
        />}

        {/* ========== ROUTES TAB ========== */}
        {activeTab === 'routes' && <RoutesTab routeStats={getRouteStats()} />}

        {/* ========== TRUCKS TAB ========== */}
        {activeTab === 'trucks' && <TrucksTab truckStats={getTruckStats()} />}

        {/* ========== DRIVERS TAB ========== */}
        {activeTab === 'drivers' && <DriversTab driverStats={getDriverStats()} />}

        {/* ========== REPORTS TAB ========== */}
        {activeTab === 'reports' && <ReportsTab 
          trips={trips}
          monthlyStats={getMonthlyStats}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onExport={exportToCSV}
        />}
      </div>
    </div>
  );
};

// ============= LOGIN COMPONENT =============
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'inherit'
        }}
      />
      <input
        type="password"
        placeholder="Enter password (any password works)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'inherit'
        }}
      />
      <button
        type="submit"
        style={{
          background: '#667eea',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '14px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'background 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.background = '#5568d3'}
        onMouseLeave={(e) => e.target.style.background = '#667eea'}
      >
        Login
      </button>
      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
        Demo: Use any email/password
      </p>
    </form>
  );
};

// ============= DASHBOARD COMPONENT =============
const Dashboard = ({ monthlyStats, selectedMonth, setSelectedMonth, tripsCount, routeStats }) => {
  const topRoutes = Object.entries(routeStats)
    .sort(([, a], [, b]) => (b.profit || 0) - (a.profit || 0))
    .slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', color: '#333' }}>
          Select Month
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Total Revenue" value={`₹${(monthlyStats.totalRevenue || 0).toFixed(0)}`} icon="💰" />
        <StatCard title="Total Expenses" value={`₹${(monthlyStats.totalExpenses || 0).toFixed(0)}`} icon="💸" />
        <StatCard title="Profit/Loss" value={`₹${(monthlyStats.totalProfit || 0).toFixed(0)}`} icon={monthlyStats.totalProfit >= 0 ? "📈" : "📉"} color={monthlyStats.totalProfit >= 0 ? '#10b981' : '#ef4444'} />
        <StatCard title="Advance Received" value={`₹${(monthlyStats.totalAdvance || 0).toFixed(0)}`} icon="✅" />
        <StatCard title="Pending Payment" value={`₹${(monthlyStats.totalPending || 0).toFixed(0)}`} icon="⏳" />
        <StatCard title="Total Trips" value={monthlyStats.tripCount} icon="🚚" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Top Profitable Routes</h3>
          {topRoutes.length === 0 ? (
            <p style={{ color: '#999' }}>No routes yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topRoutes.map(([route, stats]) => (
                <div key={route} style={{
                  background: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{ fontWeight: '600', color: '#333' }}>{route}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {stats.trips} trips • ₹{stats.profit.toFixed(0)} profit
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============= STAT CARD COMPONENT =============
const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    borderTop: `4px solid ${color || '#667eea'}`
  }}>
    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: color || '#333' }}>{value}</div>
  </div>
);

// ============= TRIPS TAB COMPONENT =============
const TripsTab = ({ showForm, setShowForm, formData, setFormData, onAddTrip, trips, onEdit, onDelete, calculateProfit, calculatePending, editingTrip, onCancel }) => {
  return (
    <div>
      {!showForm ? (
        <>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <Plus size={18} /> Add New Trip
          </button>

          <div style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {trips.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                No trips added yet. Click "Add New Trip" to get started.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Trip ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Route</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Profit</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip, idx) => (
                      <tr key={trip.id} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{trip.tripId || 'N/A'}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{trip.fromCity}-{trip.toCity}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{trip.date}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>₹{(trip.revenueAmount || 0).toFixed(0)}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: calculateProfit(trip) >= 0 ? '#10b981' : '#ef4444' }}>
                          ₹{calculateProfit(trip).toFixed(0)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{
                            background: trip.status === 'Completed' ? '#d1fae5' : trip.status === 'POD Delivered' ? '#bfdbfe' : trip.status === 'Invoiced' ? '#fef3c7' : '#e5e7eb',
                            color: trip.status === 'Completed' ? '#047857' : trip.status === 'POD Delivered' ? '#1e40af' : trip.status === 'Invoiced' ? '#92400e' : '#374151',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {trip.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => onEdit(trip)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => onDelete(trip.id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <TripForm 
          formData={formData}
          setFormData={setFormData}
          onSubmit={onAddTrip}
          onCancel={onCancel}
          isEditing={!!editingTrip}
        />
      )}
    </div>
  );
};

// ============= TRIP FORM COMPONENT =============
const TripForm = ({ formData, setFormData, onSubmit, onCancel, isEditing }) => {
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const formFields = [
    { label: 'Trip ID', field: 'tripId', type: 'text', placeholder: 'e.g., trip-001' },
    { label: 'Date', field: 'date', type: 'date' },
    { label: 'From City', field: 'fromCity', type: 'text', placeholder: 'e.g., Delhi' },
    { label: 'To City', field: 'toCity', type: 'text', placeholder: 'e.g., Chennai' },
    { label: 'Truck Number', field: 'truck', type: 'text', placeholder: 'e.g., MH-01-AB-1234' },
    { label: 'Driver Name', field: 'driver', type: 'text', placeholder: 'e.g., Raj Kumar' },
    { label: 'Revenue Amount (₹)', field: 'revenueAmount', type: 'number', placeholder: '100000' },
    { label: 'Advance Amount (₹)', field: 'advanceAmount', type: 'number', placeholder: '90000' },
    { label: 'Broker Name', field: 'brokerName', type: 'text', placeholder: 'e.g., ABC Logistics' },
    { label: 'Broker Commission (₹) - Manual Entry', field: 'brokerCommission', type: 'number', placeholder: '5000' },
    { label: 'Fuel Cost (₹)', field: 'fuel', type: 'number', placeholder: '8000' },
    { label: 'Toll Charges (₹)', field: 'toll', type: 'number', placeholder: '2000' },
    { label: 'Loading/Unloading (₹)', field: 'loading', type: 'number', placeholder: '3000' },
    { label: 'Maintenance (₹) - Optional', field: 'maintenance', type: 'number', placeholder: '0' },
    { label: 'Permits/Documentation (₹) - Optional', field: 'permits', type: 'number', placeholder: '0' },
    { label: 'Cargo Type - Optional', field: 'cargo', type: 'text', placeholder: 'e.g., Groceries' },
    { label: 'Client Name - Optional', field: 'clientName', type: 'text', placeholder: 'e.g., XYZ Company' },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      maxWidth: '800px'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>{isEditing ? 'Edit Trip' : 'Add New Trip'}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {formFields.map(({ label, field, type, placeholder }) => (
          <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              {label}
            </label>
            <input
              type={type}
              value={formData[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={placeholder}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        ))}
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          >
            <option>In Progress</option>
            <option>Completed</option>
            <option>POD Delivered</option>
            <option>Invoiced</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
        <button
          onClick={onSubmit}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {isEditing ? 'Update Trip' : 'Add Trip'}
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#e5e7eb',
            color: '#333',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ============= ROUTES TAB COMPONENT =============
const RoutesTab = ({ routeStats }) => {
  const sortedRoutes = Object.entries(routeStats)
    .map(([route, stats]) => ({ route, ...stats }))
    .sort((a, b) => (b.profit || 0) - (a.profit || 0));

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#333' }}>Route Analysis</h2>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {sortedRoutes.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
            No route data available
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Route</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Trips</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Total Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Total Profit</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Avg Profit/Trip</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutes.map((route, idx) => (
                  <tr key={route.route} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{route.route}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{route.trips}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>₹{(route.revenue || 0).toFixed(0)}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: route.profit >= 0 ? '#10b981' : '#ef4444' }}>
                      ₹{(route.profit || 0).toFixed(0)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>₹{((route.profit || 0) / route.trips).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= TRUCKS TAB COMPONENT =============
const TrucksTab = ({ truckStats }) => {
  const sortedTrucks = Object.entries(truckStats)
    .map(([truck, stats]) => ({ truck, ...stats }))
    .sort((a, b) => (b.profit || 0) - (a.profit || 0));

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#333' }}>Truck Performance</h2>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {sortedTrucks.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
            No truck data available
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Truck</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Trips</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Total Revenue</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Total Profit</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrucks.map((truck, idx) => (
                  <tr key={truck.truck} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{truck.truck}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{truck.trips}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>₹{(truck.revenue || 0).toFixed(0)}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600', color: truck.profit >= 0 ? '#10b981' : '#ef4444' }}>
                      ₹{(truck.profit || 0).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= DRIVERS TAB COMPONENT =============
const DriversTab = ({ driverStats }) => {
  const sortedDrivers = Object.entries(driverStats)
    .map(([driver, stats]) => ({ driver, ...stats }))
    .sort((a, b) => (b.earnings || 0) - (a.earnings || 0));

  return (
    <div>
      <h2 style={{ marginTop: 0, color: '#333' }}>Driver Earnings</h2>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {sortedDrivers.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
            No driver data available
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Driver</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Trips</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#333' }}>Total Earnings (15% of revenue)</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map((driver, idx) => (
                  <tr key={driver.driver} style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '600' }}>{driver.driver}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{driver.trips}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>₹{(driver.earnings || 0).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= REPORTS TAB COMPONENT =============
const ReportsTab = ({ trips, monthlyStats, selectedMonth, setSelectedMonth, onExport }) => {
  const stats = monthlyStats(selectedMonth);

  const handleExportMonthly = () => {
    const monthTrips = trips.filter(t => t.date.startsWith(selectedMonth)).map(t => ({
      'Trip ID': t.tripId,
      'Date': t.date,
      'Route': `${t.fromCity}-${t.toCity}`,
      'Truck': t.truck,
      'Driver': t.driver,
      'Revenue': `₹${(t.revenueAmount || 0).toFixed(0)}`,
      'Broker Comm': `₹${(t.brokerCommission || 0).toFixed(0)}`,
      'Fuel': `₹${(t.fuel || 0).toFixed(0)}`,
      'Toll': `₹${(t.toll || 0).toFixed(0)}`,
      'Loading': `₹${(t.loading || 0).toFixed(0)}`,
      'Maintenance': `₹${(t.maintenance || 0).toFixed(0)}`,
      'Permits': `₹${(t.permits || 0).toFixed(0)}`,
      'Advance': `₹${(t.advanceAmount || 0).toFixed(0)}`,
      'Status': t.status
    }));
    onExport(monthTrips, `trips-report-${selectedMonth}.csv`);
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', color: '#333' }}>
          Select Month
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard title="Total Revenue" value={`₹${(stats.totalRevenue || 0).toFixed(0)}`} icon="💰" />
        <StatCard title="Total Expenses" value={`₹${(stats.totalExpenses || 0).toFixed(0)}`} icon="💸" />
        <StatCard title="Net Profit/Loss" value={`₹${(stats.totalProfit || 0).toFixed(0)}`} icon={stats.totalProfit >= 0 ? "📈" : "📉"} color={stats.totalProfit >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Export Report</h3>
        <button
          onClick={handleExportMonthly}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Download size={18} /> Download CSV Report
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Expense Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Broker Commission', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + (t.brokerCommission || 0), 0) },
            { label: 'Driver Salary (15%)', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + ((t.revenueAmount || 0) * 0.15), 0) },
            { label: 'Fuel', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + (t.fuel || 0), 0) },
            { label: 'Toll', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + (t.toll || 0), 0) },
            { label: 'Loading/Unloading', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + (t.loading || 0), 0) },
            { label: 'Maintenance', value: trips.filter(t => t.date.startsWith(selectedMonth)).reduce((s, t) => s + (t.maintenance || 0), 0) },
          ].map(item => (
            <div key={item.label} style={{
              background: '#f9fafb',
              padding: '15px',
              borderRadius: '6px',
              borderLeft: '4px solid #667eea'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{item.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>₹{item.value.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransportPlatform;
