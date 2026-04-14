import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon courses">📚</div>
        <div class="stat-info">
          <span class="stat-label">Total Courses</span>
          <span class="stat-value">3</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon lessons">📝</div>
        <div class="stat-info">
          <span class="stat-label">Total Lessons</span>
          <span class="stat-value">12</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon students">👥</div>
        <div class="stat-info">
          <span class="stat-label">Total Students</span>
          <span class="stat-value">1,250</span>
        </div>
      </div>
    </div>

    <div class="welcome-section">
      <h3>Welcome to Management System</h3>
      <p>From here you can manage your English courses, lessons, and student progress.</p>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .stat-icon.courses { background: #eff6ff; }
    .stat-icon.lessons { background: #fdf2f8; }
    .stat-icon.students { background: #f0fdf4; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .welcome-section {
      background: white;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      text-align: center;

      h3 { font-size: 24px; margin-bottom: 12px; color: #1e293b; }
      p { color: #64748b; }
    }
  `]
})
export class AdminDashboardComponent {}
