---
applyTo: "src/**/*.ts"
---

# Angular Signal Patterns

## Layered Derivation Pattern

Build a dependency graph of computed signals where each layer derives from the previous:

```typescript
@Component({
  selector: 'app-cost-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-grid">
      @if (isLoading()) {
        <app-loading-spinner />
      } @else {
        <app-stat-card label="Total Cost" [value]="totalCost() | currency" />
        <app-stat-card label="Avg Cost/Request" [value]="averageCostPerRequest() | currency" />
        <app-stat-card label="Cache Savings" [value]="cacheSavingsPercentage() | percent" />
      }
    </div>
  `,
})
export class CostDashboardComponent {
  // Layer 1: Source signals
  readonly selectedPeriodType = signal<'current' | 'custom'>('current');
  readonly costSummary = resource({ /* ... */ });
  readonly customReportData = signal<CostData | null>(null);

  // Layer 2: Data source switching
  readonly activeData = computed(() => {
    const periodType = this.selectedPeriodType();
    return periodType === 'current' ? this.costSummary.value() : this.customReportData();
  });

  // Layer 3: Direct derivations (safe null handling)
  readonly totalCost = computed(() => this.activeData()?.totalCost ?? 0);
  readonly totalRequests = computed(() => this.activeData()?.totalRequests ?? 0);

  // Layer 4: Business logic from Layer 3
  readonly averageCostPerRequest = computed(() => {
    const total = this.totalCost();
    const requests = this.totalRequests();
    return requests > 0 ? total / requests : 0;
  });
}
```

## Form State with Signals

```typescript
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', Validators.required],
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly canSubmit = computed(() => this.form.valid && !this.isSubmitting());

  async onSubmit() {
    if (!this.canSubmit()) return;
    this.isSubmitting.set(true);
    this.submitError.set(null);
    try {
      await this.userService.save(this.form.getRawValue());
    } catch (e) {
      this.submitError.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

## Parent-Child Communication

```typescript
// child.component.ts
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="decrement()">-</button>
    <span>{{ value() }}</span>
    <button (click)="increment()">+</button>
  `,
})
export class CounterComponent {
  readonly value = input.required<number>();
  readonly valueChange = output<number>();

  increment() { this.valueChange.emit(this.value() + 1); }
  decrement() { this.valueChange.emit(this.value() - 1); }
}

// parent.component.ts
@Component({
  selector: 'app-parent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CounterComponent],
  template: `
    <app-counter [value]="count()" (valueChange)="count.set($event)" />
    <p>Double: {{ doubled() }}</p>
  `,
})
export class ParentComponent {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count() * 2);
}
```

## List with Derived Selection State

```typescript
export class ItemListComponent {
  readonly items = input.required<Item[]>();
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly selectedItems = computed(() =>
    this.items().filter(item => this.selectedIds().has(item.id))
  );

  readonly allSelected = computed(() =>
    this.items().length > 0 && this.selectedIds().size === this.items().length
  );

  toggleItem(id: string) {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleAll() {
    this.allSelected()
      ? this.selectedIds.set(new Set())
      : this.selectedIds.set(new Set(this.items().map(i => i.id)));
  }
}
```
