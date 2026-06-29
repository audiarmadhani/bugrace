export type ApplicationId = 'store' | 'banking' | 'crm';

export type BugPage =
  | 'Login'
  | 'Catalog'
  | 'Product Details'
  | 'Cart'
  | 'Checkout'
  | 'Orders'
  | 'Profile';

export type BugCategory =
  | 'UI'
  | 'Functional'
  | 'Validation'
  | 'Authorization'
  | 'Session Management'
  | 'Security'
  | 'Calculation'
  | 'Data Persistence';

export type BugSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ChallengeStatus = 'OPEN' | 'REVEALED';

export type InjectionPoint =
  | 'store.login.validate'
  | 'store.login.errorMessage'
  | 'store.catalog.search'
  | 'store.catalog.sort'
  | 'store.catalog.filter'
  | 'store.product.addToCart'
  | 'store.product.quantity'
  | 'store.cart.calculateTotal'
  | 'store.cart.removeItem'
  | 'store.cart.updateQuantity'
  | 'store.cart.onLogout'
  | 'store.checkout.validate'
  | 'store.checkout.submit'
  | 'store.orders.list'
  | 'store.orders.displayTotal'
  | 'store.profile.read'
  | 'store.profile.update'
  | 'store.profile.onLogout';

export interface BugDefinition {
  id: string;
  application: ApplicationId;
  title: string;
  page: BugPage;
  category: BugCategory;
  severity: BugSeverity;
  difficulty: 1 | 2 | 3 | 4 | 5;
  rootCause: string;
  implementationStrategy: string;
  injectionPoint: InjectionPoint;
}

export type BugBehaviorHandler = (
  point: InjectionPoint,
  ctx: unknown,
  defaultFn: () => unknown
) => unknown;

export type BugBehaviorMap = Partial<Record<string, BugBehaviorHandler>>;

export interface SeasonChallenge {
  challengeDate: Date;
  bugId: string;
  bugTitle: string;
  correctPage: BugPage;
  correctCategory: BugCategory;
  correctSeverity: BugSeverity;
  rootCause: string;
}
