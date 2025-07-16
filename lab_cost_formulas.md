# Lab Visit Cost Formulas by Age Group

## Overview

Lab visits have distinct characteristics compared to other healthcare services:

- **Shorter duration** than family medicine visits
- **No meal costs** (quick visits)
- **Similar travel and parking costs** to outpatient visits
- **Same age group logic** for productivity and caregiving

## Lab-Specific Constants

- `lab_wait = 0.25` hours (lab wait time - shorter than family medicine)
- `lab_appt = 0.15` hours (lab appointment time - shorter than family medicine)
- `car_cost_per_km = 0.48` (cost per kilometer for car travel)
- `caregiver_0_14 = 1.0` (caregiver coefficient for ages 0-14)
- `caregiver_15 = 0.5` (caregiver coefficient for ages 15+)

## Cost Components

Each lab visit has three cost components:

1. **Lost Productivity (LP)** - Wage loss for working-age patients
2. **Informal Caregiving (IC)** - Cost of caregiver time
3. **Out of Pocket (OOP)** - Direct expenses (travel, parking)

## Derived Formulas by Age Group

### 1. Age Group 0-14 (Children)

#### Lost Productivity:

```
LP = 0 (no productivity loss for children)
```

#### Informal Caregiving:

```
IC = (lab_wait + lab_appt + duration) × wage × caregiver_0_14
   = (0.25 + 0.15 + duration) × wage × 1.0
   = (0.40 + duration) × wage
```

#### Out of Pocket:

```
OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + 0 + parking
    = (distance × 0.48) + parking
```

#### Total Cost:

```
Total Cost = IC + OOP
          = (0.40 + duration) × wage + (distance × 0.48) + parking
```

### 2. Age Group 15-64 (Working Age)

#### Lost Productivity:

```
LP = (lab_wait + lab_appt + duration) × wage
   = (0.25 + 0.15 + duration) × wage
   = (0.40 + duration) × wage
```

#### Informal Caregiving:

```
IC = (lab_wait + lab_appt + duration) × wage × caregiver_15
   = (0.25 + 0.15 + duration) × wage × 0.5
   = (0.40 + duration) × wage × 0.5
```

#### Out of Pocket:

```
OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + 0 + parking
    = (distance × 0.48) + parking
```

#### Total Cost:

```
Total Cost = LP + IC + OOP
          = (0.40 + duration) × wage + (0.40 + duration) × wage × 0.5 + (distance × 0.48) + parking
          = (0.40 + duration) × wage × 1.5 + (distance × 0.48) + parking
```

### 3. Age Group 65+ (Seniors)

#### Lost Productivity:

```
LP = 0 (no productivity loss for seniors)
```

#### Informal Caregiving:

```
IC = (lab_wait + lab_appt + duration) × wage × caregiver_15
   = (0.25 + 0.15 + duration) × wage × 0.5
   = (0.40 + duration) × wage × 0.5
```

#### Out of Pocket:

```
OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + 0 + parking
    = (distance × 0.48) + parking
```

#### Total Cost:

```
Total Cost = IC + OOP
          = (0.40 + duration) × wage × 0.5 + (distance × 0.48) + parking
```

## Consolidated Formula Matrix

| Age Group | Lost Productivity        | Informal Caregiving            | Out of Pocket               | Total Cost Formula                                           |
| --------- | ------------------------ | ------------------------------ | --------------------------- | ------------------------------------------------------------ |
| 0-14      | 0                        | (0.40 + duration) × wage       | (distance × 0.48) + parking | (0.40 + duration) × wage + (distance × 0.48) + parking       |
| 15-64     | (0.40 + duration) × wage | (0.40 + duration) × wage × 0.5 | (distance × 0.48) + parking | (0.40 + duration) × wage × 1.5 + (distance × 0.48) + parking |
| 65+       | 0                        | (0.40 + duration) × wage × 0.5 | (distance × 0.48) + parking | (0.40 + duration) × wage × 0.5 + (distance × 0.48) + parking |

## Key Differences from Family Medicine

1. **Shorter Time**: Lab visits use 0.40 hours base time vs 0.76 hours for family medicine
2. **No Meal Costs**: Lab visits typically don't include meal expenses
3. **Same Age Logic**: Productivity loss and caregiving coefficients follow the same pattern
4. **Travel Costs**: Same distance-based travel costs as other outpatient services

## Default Parameter Values for Lab Visits

- `wage = 30.54`
- `distance = 35` km
- `duration = 0.25` hours (shorter than family medicine)
- `age = 40`
- `meal = 0` (no meal for lab visits)
- `parking = 3` (varies by location)

## Example Calculations

### Child (Age 10):

```
LP = 0
IC = (0.40 + 0.25) × 30.54 × 1.0 = 19.85
OOP = (35 × 0.48) + 0 + 3 = 19.80
Total = 39.65
```

### Working Adult (Age 40):

```
LP = (0.40 + 0.25) × 30.54 = 19.85
IC = (0.40 + 0.25) × 30.54 × 0.5 = 9.93
OOP = (35 × 0.48) + 0 + 3 = 19.80
Total = 49.58
```

### Senior (Age 70):

```
LP = 0
IC = (0.40 + 0.25) × 30.54 × 0.5 = 9.93
OOP = (35 × 0.48) + 0 + 3 = 19.80
Total = 29.73
```

## JavaScript Implementation

The calculator includes dedicated functions for each age group:

```javascript
const calculator = new PFCCalculator();

// General lab visit calculation
const labCost = calculator.calculateLabVisit({ age: 40, distance: 35 });

// Age-specific functions
const childLabCost = calculator.calculateLabVisitChild({ distance: 35 });
const adultLabCost = calculator.calculateLabVisitAdult({ distance: 35 });
const seniorLabCost = calculator.calculateLabVisitSenior({ distance: 35 });
```

## Sensitivity Analysis

Lab visit costs are most sensitive to:

1. **Distance** - affects travel costs linearly
2. **Wage** - affects productivity and caregiving costs
3. **Duration** - affects time-based costs
4. **Parking** - varies by location

The formulas provide a comprehensive framework for calculating lab visit costs across different demographic groups and geographic locations.
