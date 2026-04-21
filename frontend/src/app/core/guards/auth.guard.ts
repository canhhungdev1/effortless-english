import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const userRole = authService.userSignal()?.role;
    const requiresAdmin = route.data?.['requiresAdmin'];
    
    console.log(`[AuthGuard] Checking access to ${state.url}. RequiredAdmin: ${requiresAdmin}, UserRole: ${userRole}`);

    if (requiresAdmin && !authService.isAdmin()) {
      console.warn(`[AuthGuard] Access denied for role: ${userRole}. Redirecting to home.`);
      router.navigate(['/']);
      return false;
    }
    return true;
  }

  // Not logged in, redirect to login page with the return url
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  return authGuard(route, state);
};
