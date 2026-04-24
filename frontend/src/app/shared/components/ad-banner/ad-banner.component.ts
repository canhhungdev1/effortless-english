import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ad-wrapper" [class.sidebar-mode]="type === 'sidebar'" [class.horizontal-mode]="type === 'horizontal'">
      <div class="ad-label">
        <span>SPONSORED AD</span>
        <div class="ad-info-icon" title="This is a simulated ad for testing layout. Ads help keep this platform free!">?</div>
      </div>
      
      <div class="ad-frame">
        <!-- Skeleton Loader while "loading" -->
        <div class="skeleton-loader" *ngIf="isLoading">
          <div class="shimmer"></div>
        </div>

        <div class="ad-content" [class.visible]="!isLoading">
          <ng-container *ngIf="!isExternalLoaded; else externalAd">
            <a [href]="currentAd.link" target="_blank" class="placeholder-ad">
              <img [src]="currentAd.imageUrl" [alt]="currentAd.title" class="ad-image" />
              <div class="ad-text-overlay" *ngIf="type === 'horizontal'">
                <div class="ad-badge">Promoted</div>
                <h4>{{ currentAd.title }}</h4>
                <p>{{ currentAd.description }}</p>
                <div class="ad-btn">Learn More</div>
              </div>
            </a>
          </ng-container>
          
          <ng-template #externalAd>
            <div class="external-ad-slot"></div>
          </ng-template>
        </div>
      </div>

      <div class="ad-footer">
        <button class="hide-ad-btn" (click)="onRemove()">Remove ads with Support</button>
      </div>
    </div>
  `,
  styles: [`
    .ad-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px;
      margin: 24px 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      min-height: 100px;
    }

    .horizontal-mode { max-width: 900px; margin-left: auto; margin-right: auto; }
    .sidebar-mode { width: 100%; margin: 16px 0; }

    .ad-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
      font-size: 8px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 1.5px;
    }

    .ad-info-icon {
      width: 14px;
      height: 14px;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: help;
      font-size: 9px;
      color: #64748b;
    }

    .ad-frame {
      position: relative;
      min-height: 80px;
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
    }

    /* Skeleton Loader Styling */
    .skeleton-loader {
      position: absolute;
      inset: 0;
      background: #f1f5f9;
      display: flex;
      overflow: hidden;
    }

    .shimmer {
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .ad-content {
      opacity: 0;
      transition: opacity 0.5s ease;
      &.visible { opacity: 1; }
    }

    .placeholder-ad {
      display: flex;
      text-decoration: none;
      color: inherit;
    }

    .ad-image {
      width: 150px;
      height: auto;
      object-fit: cover;
      display: block;
    }

    .sidebar-mode .ad-image { width: 100%; }

    .ad-text-overlay {
      padding: 12px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      
      h4 { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1e293b; }
      p { margin: 0 12px 0 0; font-size: 12px; color: #64748b; line-height: 1.4; }
    }

    .ad-badge {
      display: inline-block;
      font-size: 9px;
      padding: 1px 6px;
      background: #fef3c7;
      color: #92400e;
      border-radius: 4px;
      font-weight: 700;
      margin-bottom: 6px;
      width: fit-content;
    }

    .ad-btn {
      margin-top: 10px;
      width: fit-content;
      padding: 4px 12px;
      background: #3b82f6;
      color: white;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
    }

    .ad-footer {
      display: flex;
      justify-content: flex-end;
      padding: 0 4px;
    }

    .hide-ad-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 10px;
      cursor: pointer;
      &:hover { color: #3b82f6; text-decoration: underline; }
    }
  `]
})
export class AdBannerComponent implements OnInit {
  @Input() type: 'horizontal' | 'sidebar' = 'horizontal';
  @Input() imageUrl?: string;
  @Input() title?: string;
  @Input() description?: string;
  @Input() link?: string;
  
  isLoading = true;
  isExternalLoaded = false;
  
  // Danh sách các quảng cáo giả lập để ngẫu nhiên hóa
  private adPool = [
    {
      title: 'Master English with Effortless Club',
      description: 'Join over 1 million students learning with the #1 method in the world.',
      imageUrl: '/assets/ads/sample-ad.png',
      link: 'https://effortlessenglishclub.com'
    },
    {
      title: 'Power English Mastery',
      description: 'Speaking English fluently and confidently with AJ Hoge.',
      imageUrl: '/assets/ads/dashboard-inline.png',
      link: 'https://effortlessenglishclub.com'
    },
    {
      title: 'Speak English Like a Native',
      description: 'Exclusive tips and lessons from the top English teachers.',
      imageUrl: '/assets/ads/sidebar-ad.png',
      link: 'https://effortlessenglishclub.com'
    }
  ];

  currentAd = this.adPool[0];

  ngOnInit() {
    // Ngẫu nhiên hóa quảng cáo khi init
    const randomIndex = Math.floor(Math.random() * this.adPool.length);
    const randomAd = this.adPool[randomIndex];

    // Ưu tiên dữ liệu từ Input nếu có truyền vào từ component cha
    this.currentAd = {
      title: this.title || randomAd.title,
      description: this.description || randomAd.description,
      imageUrl: this.imageUrl || randomAd.imageUrl,
      link: this.link || randomAd.link
    };

    // Giả lập thời gian load của mạng quảng cáo (1.5 giây)
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  onRemove() {
    alert('This will take you to the Donation page once implemented!');
  }
}
