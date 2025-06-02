import React, { Component } from 'react';
import axios from 'axios';

class UserProfilesByDepartment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      index: '',
      company: '',
      result: null,
      loading: false
    };
  }

  handleChange = (field, value) => {
    this.setState({ [field]: value });
  };

  fetchData = async () => {
    const { index, company } = this.state;
    if (!index || !company) {
      alert("Both index and company are required.");
      return;
    }

    const requestBody = { index, company };

    this.setState({ loading: true });

    try {
      const response = await axios.post('/api/users/by-company', requestBody);
      this.setState({ result: response.data });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data.');
    } finally {
      this.setState({ loading: false });
    }
  };

  renderDepartmentTable = (department, users) => (
    <div key={department} style={{ marginBottom: '20px' }}>
      <h3>{department}</h3>
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.userId}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  render() {
    const { index, company, result, loading } = this.state;

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h2>Company Department Users</h2>

        {/* Input Section */}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Index"
            value={index}
            onChange={e => this.handleChange('index', e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={e => this.handleChange('company', e.target.value)}
          />
        </div>

        <button onClick={this.fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>

        {/* Output Section */}
        {result && (
          <div style={{ marginTop: '30px' }}>
            <h3>Total Users: {result.totalUsers}</h3>
            <h3>Total Salary: {result['Total salary']}</h3>

            {Object.entries(result)
              .filter(([key]) => key !== 'totalUsers' && key !== 'Total salary')
              .map(([dept, users]) => this.renderDepartmentTable(dept, users))}
          </div>
        )}
      </div>
    );
  }
}

export default UserProfilesByDepartment;
