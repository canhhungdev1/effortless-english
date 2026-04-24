import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService, UserStats } from '../../core/services/gamification.service';
import { AuthService } from '../../core/auth/auth.service';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexTooltip,
  ApexTheme
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  markers: ApexMarkers;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  theme: ApexTheme;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1 class="page-title">Learning Analytics</h1>
        <div class="date-range">Last 12 Months</div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid" *ngIf="stats()">
        <div class="stat-card">
          <div class="card-icon time">🕒</div>
          <div class="card-content">
            <span class="card-label">Total Listening</span>
            <span class="card-value">{{ formatTime(totalSeconds()) }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon words">📚</div>
          <div class="card-content">
            <span class="card-label">Words Mastered</span>
            <span class="card-value">{{ totalWords() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon streak">🔥</div>
          <div class="card-content">
            <span class="card-label">Current Streak</span>
            <span class="card-value">{{ stats()?.streak || 0 }} Days</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon xp">⭐</div>
          <div class="card-content">
            <span class="card-label">Global XP</span>
            <span class="card-value">{{ stats()?.xp || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Main Chart -->
      <div class="chart-section glass-card" *ngIf="stats()">
        <div class="chart-header">
          <h3>Daily Listening Time</h3>
          <p>Your activity over the past 30 days</p>
        </div>
        <div class="chart-wrapper">
          <apx-chart
            [series]="chartOptions.series"
            [chart]="chartOptions.chart"
            [xaxis]="chartOptions.xaxis"
            [dataLabels]="chartOptions.dataLabels"
            [grid]="chartOptions.grid"
            [stroke]="chartOptions.stroke"
            [markers]="chartOptions.markers"
            [yaxis]="chartOptions.yaxis"
            [fill]="chartOptions.fill"
            [tooltip]="chartOptions.tooltip"
            [theme]="chartOptions.theme"
          ></apx-chart>
        </div>
      </div>

      <!-- Heatmap Section -->
      <div class="heatmap-section glass-card" *ngIf="stats()">
        <div class="chart-header">
          <h3>Consistency Map</h3>
          <p>Your daily activity patterns</p>
        </div>
        <div class="heatmap-grid">
           <div class="day-cell" *ngFor="let day of heatmapData()" 
                [style.background]="getDayColor(day.value)"
                [title]="day.date + ': ' + day.value + ' mins'">
           </div>
        </div>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="legend-scale">
            <div class="scale-cell" style="background: #f1f5f9"></div>
            <div class="scale-cell" style="background: #dcfce7"></div>
            <div class="scale-cell" style="background: #86efac"></div>
            <div class="scale-cell" style="background: #22c55e"></div>
            <div class="scale-cell" style="background: #15803d"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <!-- Guest Empty State -->
      <div class="empty-state glass-card" *ngIf="!isLoggedIn()">
        <div class="empty-icon">🔒</div>
        <h2>Unlock Your Analytics</h2>
        <p>Create an account to track your progress, earn badges, and see detailed statistics of your learning journey.</p>
        <button class="cta-btn">Sign Up Free</button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 8px 0 40px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-title { font-size: 32px; font-weight: 850; color: var(--text-primary); margin: 0; letter-spacing: -0.5px; }
    .date-range { font-size: 14px; font-weight: 600; color: var(--text-muted); background: var(--bg-gray); padding: 6px 14px; border-radius: 20px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card {
      background: white; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid var(--border-light); transition: transform 0.2s;
      &:hover { transform: translateY(-3px); border-color: var(--primary-light); }
    }
    .card-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .card-icon.time { background: #eff6ff; color: #3b82f6; }
    .card-icon.words { background: #f0fdf4; color: #22c55e; }
    .card-icon.streak { background: #fff7ed; color: #f97316; }
    .card-icon.xp { background: #fdf2f8; color: #ec4899; }
    .card-content { display: flex; flex-direction: column; }
    .card-label { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .card-value { font-size: 20px; font-weight: 850; color: var(--text-primary); }

    .glass-card { background: white; border: 1px solid var(--border-light); border-radius: 24px; padding: 32px; margin-bottom: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .chart-header { margin-bottom: 24px; h3 { font-size: 18px; font-weight: 800; margin: 0 0 4px; } p { font-size: 14px; color: var(--text-muted); margin: 0; } }
    .chart-wrapper { min-height: 350px; }

    .heatmap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14px, 1fr)); gap: 4px; margin-bottom: 16px; }
    .day-cell { aspect-ratio: 1; border-radius: 3px; cursor: pointer; transition: transform 0.1s; &:hover { transform: scale(1.3); z-index: 10; } }
    .heatmap-legend { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .legend-scale { display: flex; gap: 4px; }
    .scale-cell { width: 12px; height: 12px; border-radius: 2px; }

    .empty-state { text-align: center; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; }
    .empty-icon { font-size: 64px; margin-bottom: 24px; }
    .empty-state h2 { font-size: 24px; font-weight: 850; margin-bottom: 12px; }
    .empty-state p { font-size: 16px; color: var(--text-muted); max-width: 400px; line-height: 1.6; margin-bottom: 32px; }
    .cta-btn { background: var(--primary); color: white; border: none; padding: 14px 32px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: transform 0.2s; &:hover { transform: scale(1.05); } }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .page-title { font-size: 24px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);

  stats = signal<UserStats | null>(null);
  totalSeconds = signal(0);
  totalWords = signal(0);
  heatmapData = signal<any[]>([]);
  isLoggedIn = signal(false);

  public chartOptions: ChartOptions;

  constructor() {
    this.chartOptions = {
      series: [{ name: 'Minutes', data: [] }],
      chart: { height: 350, type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3, colors: ['#4f46e5'] },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      xaxis: { categories: [], axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8' } } },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100], colorStops: [] } },
      markers: { size: 4, colors: ['#4f46e5'], strokeColors: '#fff', strokeWidth: 2 },
      tooltip: { theme: 'light', x: { show: false }, y: { formatter: (val: number) => val + ' mins' } },
      theme: { mode: 'light' },
      title: { text: '' }
    };
  }

  ngOnInit() {
    this.isLoggedIn.set(this.authService.isLoggedIn());
    if (this.isLoggedIn()) {
      this.loadStats();
    }
  }

  loadStats() {
    this.gamificationService.getStats().subscribe(stats => {
      this.stats.set(stats);
      this.processChartData(stats.history);
      this.processHeatmapData(stats.history);
      
      const totalSec = stats.history.reduce((acc, curr) => acc + curr.listening_time, 0);
      const totalW = stats.history.reduce((acc, curr) => acc + curr.words_learned, 0);
      this.totalSeconds.set(totalSec);
      this.totalWords.set(totalW);
    });
  }

  processChartData(history: any[]) {
    // Last 30 days
    const last30 = history.slice(-30);
    const data = last30.map(h => Math.round(h.listening_time / 60));
    const labels = last30.map(h => {
      const d = new Date(h.date);
      return d.getDate() + '/' + (d.getMonth() + 1);
    });

    this.chartOptions.series = [{ name: 'Minutes', data }];
    this.chartOptions.xaxis = { ...this.chartOptions.xaxis, categories: labels };
  }

  processHeatmapData(history: any[]) {
    // Mock 365 days or use history
    const data = [];
    const today = new Date();
    for (let i = 250; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const historyItem = history.find(h => h.date.split('T')[0] === dateStr);
      data.push({
        date: dateStr,
        value: historyItem ? Math.round(historyItem.listening_time / 60) : 0
      });
    }
    this.heatmapData.set(data);
  }

  getDayColor(value: number): string {
    if (value === 0) return '#f1f5f9';
    if (value < 15) return '#dcfce7';
    if (value < 30) return '#86efac';
    if (value < 60) return '#22c55e';
    return '#15803d';
  }

  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }
}
