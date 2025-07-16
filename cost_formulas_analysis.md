# Patient and Family Cost (PFC) Formulas Analysis

## Overview

This document derives the mathematical formulas for calculating patient and family costs across different service types and age groups, based on the provided R code and assumptions.

## Key Constants and Parameters

### Base Constants

- `fm_wait = 0.5` hours (family medicine wait time)
- `fm_appt = 0.26` hours (family medicine appointment time)
- `caregiver_0_14 = 1.0` (caregiver coefficient for ages 0-14)
- `caregiver_15 = 0.5` (caregiver coefficient for ages 15+)
- `car_cost_per_km = 0.48` (cost per kilometer for car travel)

### Service-Specific Constants

- `ed_los_CTAS_III = 3.9` hours (ED length of stay for CTAS 1-3)
- `ed_los_CTAS_V = 2.7` hours (ED length of stay for CTAS 4-5)
- `hosp_los = 53.6` hours (hospital length of stay)
- `caregiver_0_14_hosp = 0.75` (caregiver coefficient for ages 0-14 in hospital)
- `caregiver_15_hosp = 0.25` (caregiver coefficient for ages 15+ in hospital)
- `data_usage = 1.25` (virtual visit data cost)
- `virtual_wait = 0.27` hours (virtual wait time)
- `virtual_appt = 0.35` hours (virtual appointment time)

## Cost Components

Each service type has three cost components:

1. **Lost Productivity (LP)** - Wage loss for working-age patients
2. **Informal Caregiving (IC)** - Cost of caregiver time
3. **Out of Pocket (OOP)** - Direct expenses (travel, parking, meals, etc.)

## Derived Formulas by Service Type and Age Group

### 1. Family Medicine (MD)

#### Age Group 0-14:

```
LP = 0 (no productivity loss for children)

IC = (fm_wait + fm_appt + duration) × wage × caregiver_0_14
   = (0.5 + 0.26 + duration) × wage × 1.0
   = (0.76 + duration) × wage

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = IC + OOP
```

#### Age Group 15-64:

```
LP = (fm_wait + fm_appt + duration) × wage
   = (0.5 + 0.26 + duration) × wage
   = (0.76 + duration) × wage

IC = (fm_wait + fm_appt + duration) × wage × caregiver_15
   = (0.5 + 0.26 + duration) × wage × 0.5
   = (0.76 + duration) × wage × 0.5

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = LP + IC + OOP
```

#### Age Group 65+:

```
LP = 0 (no productivity loss for seniors)

IC = (fm_wait + fm_appt + duration) × wage × caregiver_15
   = (0.5 + 0.26 + duration) × wage × 0.5
   = (0.76 + duration) × wage × 0.5

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = IC + OOP
```

### 2. Emergency Department (ED)

#### Age Group 0-14:

```
LP = 0 (no productivity loss for children)

IC = (ed_los + duration) × wage × caregiver_0_14
   = (ed_los + duration) × wage × 1.0
   = (ed_los + duration) × wage
   where ed_los = 3.9 for CTAS 1-3, 2.7 for CTAS 4-5

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = IC + OOP
```

#### Age Group 15-64:

```
LP = (ed_los + duration) × wage
   where ed_los = 3.9 for CTAS 1-3, 2.7 for CTAS 4-5

IC = (ed_los + duration) × wage × caregiver_15
   = (ed_los + duration) × wage × 0.5

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = LP + IC + OOP
```

#### Age Group 65+:

```
LP = 0 (no productivity loss for seniors)

IC = (ed_los + duration) × wage × caregiver_15
   = (ed_los + duration) × wage × 0.5

OOP = (distance × car_cost_per_km) + meal + parking
    = (distance × 0.48) + meal + parking

Total Cost = IC + OOP
```

### 3. Hospitalization (Hosp)

#### Age Group 0-14:

```
LP = 0 (no productivity loss for children)

IC = (hosp_los + duration) × wage × caregiver_0_14_hosp
   = (53.6 + duration) × wage × 0.75

OOP = (distance × car_cost_per_km) + meal + accommodation + parking
    = (distance × 0.48) + meal + accommodation + parking

Total Cost = IC + OOP
```

#### Age Group 15-64:

```
LP = (hosp_los + duration) × wage
   = (53.6 + duration) × wage

IC = (hosp_los + duration) × wage × caregiver_15_hosp
   = (53.6 + duration) × wage × 0.25

OOP = (distance × car_cost_per_km) + meal + accommodation + parking
    = (distance × 0.48) + meal + accommodation + parking

Total Cost = LP + IC + OOP
```

#### Age Group 65+:

```
LP = 0 (no productivity loss for seniors)

IC = (hosp_los + duration) × wage × caregiver_15_hosp
   = (53.6 + duration) × wage × 0.25

OOP = (distance × car_cost_per_km) + meal + accommodation + parking
    = (distance × 0.48) + meal + accommodation + parking

Total Cost = IC + OOP
```

### 4. Virtual Visits

#### Age Group 0-14:

```
LP = 0 (no productivity loss for children)

IC = (virtual_wait + virtual_appt) × wage × caregiver_0_14
   = (0.27 + 0.35) × wage × 1.0
   = 0.62 × wage

OOP = data_usage = 1.25

Total Cost = IC + OOP
```

#### Age Group 15-64:

```
LP = (virtual_wait + virtual_appt) × wage
   = (0.27 + 0.35) × wage
   = 0.62 × wage

IC = (virtual_wait + virtual_appt) × wage × caregiver_15
   = (0.27 + 0.35) × wage × 0.5
   = 0.62 × wage × 0.5

OOP = data_usage = 1.25

Total Cost = LP + IC + OOP
```

#### Age Group 65+:

```
LP = 0 (no productivity loss for seniors)

IC = (virtual_wait + virtual_appt) × wage × caregiver_15
   = (0.27 + 0.35) × wage × 0.5
   = 0.62 × wage × 0.5

OOP = data_usage = 1.25

Total Cost = IC + OOP
```

## Consolidated Formula Matrix

| Service Type  | Age Group | Lost Productivity        | Informal Caregiving             | Out of Pocket                                      |
| ------------- | --------- | ------------------------ | ------------------------------- | -------------------------------------------------- |
| MD            | 0-14      | 0                        | (0.76 + duration) × wage        | (distance × 0.48) + meal + parking                 |
| MD            | 15-64     | (0.76 + duration) × wage | (0.76 + duration) × wage × 0.5  | (distance × 0.48) + meal + parking                 |
| MD            | 65+       | 0                        | (0.76 + duration) × wage × 0.5  | (distance × 0.48) + meal + parking                 |
| ED (CTAS 1-3) | 0-14      | 0                        | (3.9 + duration) × wage         | (distance × 0.48) + meal + parking                 |
| ED (CTAS 1-3) | 15-64     | (3.9 + duration) × wage  | (3.9 + duration) × wage × 0.5   | (distance × 0.48) + meal + parking                 |
| ED (CTAS 1-3) | 65+       | 0                        | (3.9 + duration) × wage × 0.5   | (distance × 0.48) + meal + parking                 |
| ED (CTAS 4-5) | 0-14      | 0                        | (2.7 + duration) × wage         | (distance × 0.48) + meal + parking                 |
| ED (CTAS 4-5) | 15-64     | (2.7 + duration) × wage  | (2.7 + duration) × wage × 0.5   | (distance × 0.48) + meal + parking                 |
| ED (CTAS 4-5) | 65+       | 0                        | (2.7 + duration) × wage × 0.5   | (distance × 0.48) + meal + parking                 |
| Hosp          | 0-14      | 0                        | (53.6 + duration) × wage × 0.75 | (distance × 0.48) + meal + accommodation + parking |
| Hosp          | 15-64     | (53.6 + duration) × wage | (53.6 + duration) × wage × 0.25 | (distance × 0.48) + meal + accommodation + parking |
| Hosp          | 65+       | 0                        | (53.6 + duration) × wage × 0.25 | (distance × 0.48) + meal + accommodation + parking |
| Virtual       | 0-14      | 0                        | 0.62 × wage                     | 1.25                                               |
| Virtual       | 15-64     | 0.62 × wage              | 0.62 × wage × 0.5               | 1.25                                               |
| Virtual       | 65+       | 0                        | 0.62 × wage × 0.5               | 1.25                                               |

## Key Assumptions

1. **Productivity Loss**: Only applies to working-age individuals (15-64)
2. **Caregiver Coefficients**: Vary by age group and service type
3. **Travel Costs**: Based on distance and car cost per kilometer
4. **Service Times**: Include both wait time and actual service time
5. **Out-of-Pocket Costs**: Include travel, parking, meals, and accommodation where applicable

## Default Parameter Values

- `wage = 30.54`
- `distance = 35` km
- `duration = 0.75` hours
- `age = 40`
- `meal = 15` (varies by service)
- `parking = 3-37.5` (varies by service and health authority)
- `accommodation = 100` (for hospitalizations)
- `acuity = 4` (for ED visits)
