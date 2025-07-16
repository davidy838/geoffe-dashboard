// Patient and Family Cost (PFC) Calculator
// Based on the R code analysis and derived formulas

class PFCCalculator {
  constructor() {
    // Base constants
    this.fm_wait = 0.5;
    this.fm_appt = 0.26;
    this.caregiver_0_14 = 1.0;
    this.caregiver_15 = 0.5;
    this.car_cost_per_km = 0.48;
    
    // Service-specific constants
    this.ed_los_CTAS_III = 3.9;
    this.ed_los_CTAS_V = 2.7;
    this.hosp_los = 53.6;
    this.caregiver_0_14_hosp = 0.75;
    this.caregiver_15_hosp = 0.25;
    this.data_usage = 1.25;
    this.virtual_wait = 0.27;
    this.virtual_appt = 0.35;
  }

  // Helper function to determine age group
  getAgeGroup(age) {
    if (age >= 0 && age <= 14) return '0-14';
    if (age >= 15 && age <= 64) return '15-64';
    return '65+';
  }

  // Helper function to determine ED acuity level
  getEDAcuity(acuity) {
    return acuity <= 3 ? 'CTAS_1_3' : 'CTAS_4_5';
  }

  // Calculate Family Medicine costs
  calculateFamilyMedicine(params = {}) {
    const {
      wage = 30.54,
      distance = 35,
      duration = 0.75,
      age = 40,
      meal = 0,
      parking = 3
    } = params;

    const ageGroup = this.getAgeGroup(age);
    const totalTime = this.fm_wait + this.fm_appt + duration;

    let lp = 0; // Lost Productivity
    let ic = 0; // Informal Caregiving
    let oop = 0; // Out of Pocket

    // Lost Productivity (only for working age)
    if (ageGroup === '15-64') {
      lp = totalTime * wage;
    }

    // Informal Caregiving
    if (ageGroup === '0-14') {
      ic = totalTime * wage * this.caregiver_0_14;
    } else {
      ic = totalTime * wage * this.caregiver_15;
    }

    // Out of Pocket
    oop = (distance * this.car_cost_per_km) + meal + parking;

    return {
      serviceType: 'Family Medicine',
      ageGroup,
      lostProductivity: lp,
      informalCaregiving: ic,
      outOfPocket: oop,
      totalCost: lp + ic + oop,
      breakdown: {
        wage,
        distance,
        duration,
        age,
        meal,
        parking,
        totalTime
      }
    };
  }

  // Calculate Emergency Department costs
  calculateEmergencyDepartment(params = {}) {
    const {
      wage = 30.54,
      distance = 35,
      duration = 0.75,
      age = 40,
      meal = 15,
      parking = 5,
      acuity = 4
    } = params;

    const ageGroup = this.getAgeGroup(age);
    const acuityLevel = this.getEDAcuity(acuity);
    const edLos = acuityLevel === 'CTAS_1_3' ? this.ed_los_CTAS_III : this.ed_los_CTAS_V;
    const totalTime = edLos + duration;

    let lp = 0;
    let ic = 0;
    let oop = 0;

    // Lost Productivity (only for working age)
    if (ageGroup === '15-64') {
      lp = totalTime * wage;
    }

    // Informal Caregiving
    if (ageGroup === '0-14') {
      ic = totalTime * wage * this.caregiver_0_14;
    } else {
      ic = totalTime * wage * this.caregiver_15;
    }

    // Out of Pocket
    oop = (distance * this.car_cost_per_km) + meal + parking;

    return {
      serviceType: 'Emergency Department',
      ageGroup,
      acuityLevel,
      lostProductivity: lp,
      informalCaregiving: ic,
      outOfPocket: oop,
      totalCost: lp + ic + oop,
      breakdown: {
        wage,
        distance,
        duration,
        age,
        meal,
        parking,
        acuity,
        edLos,
        totalTime
      }
    };
  }

  // Calculate Hospitalization costs
  calculateHospitalization(params = {}) {
    const {
      wage = 30.54,
      distance = 35,
      duration = 0.75,
      age = 40,
      meal = 40,
      accommodation = 0,
      parking = 20
    } = params;

    const ageGroup = this.getAgeGroup(age);
    const totalTime = this.hosp_los + duration;

    let lp = 0;
    let ic = 0;
    let oop = 0;

    // Lost Productivity (only for working age)
    if (ageGroup === '15-64') {
      lp = totalTime * wage;
    }

    // Informal Caregiving (different coefficients for hospital)
    if (ageGroup === '0-14') {
      ic = totalTime * wage * this.caregiver_0_14_hosp;
    } else {
      ic = totalTime * wage * this.caregiver_15_hosp;
    }

    // Out of Pocket
    oop = (distance * this.car_cost_per_km) + meal + accommodation + parking;

    return {
      serviceType: 'Hospitalization',
      ageGroup,
      lostProductivity: lp,
      informalCaregiving: ic,
      outOfPocket: oop,
      totalCost: lp + ic + oop,
      breakdown: {
        wage,
        distance,
        duration,
        age,
        meal,
        accommodation,
        parking,
        totalTime
      }
    };
  }

  // Calculate Virtual Visit costs
  calculateVirtualVisit(params = {}) {
    const {
      wage = 30.54,
      age = 40
    } = params;

    const ageGroup = this.getAgeGroup(age);
    const totalTime = this.virtual_wait + this.virtual_appt;

    let lp = 0;
    let ic = 0;
    let oop = 0;

    // Lost Productivity (only for working age)
    if (ageGroup === '15-64') {
      lp = totalTime * wage;
    }

    // Informal Caregiving
    if (ageGroup === '0-14') {
      ic = totalTime * wage * this.caregiver_0_14;
    } else {
      ic = totalTime * wage * this.caregiver_15;
    }

    // Out of Pocket (only data usage for virtual)
    oop = this.data_usage;

    return {
      serviceType: 'Virtual Visit',
      ageGroup,
      lostProductivity: lp,
      informalCaregiving: ic,
      outOfPocket: oop,
      totalCost: lp + ic + oop,
      breakdown: {
        wage,
        age,
        totalTime
      }
    };
  }

  // Lab-specific constants
  get lab_wait() { return 0.25; } // Lab wait time (shorter than family medicine)
  get lab_appt() { return 0.15; } // Lab appointment time (shorter than family medicine)

  // Calculate Lab Visit costs
  calculateLabVisit(params = {}) {
    const {
      wage = 30.54,
      distance = 35,
      duration = 0.25, // Shorter duration for lab visits
      age = 40,
      meal = 0, // Usually no meal for lab visits
      parking = 3
    } = params;

    const ageGroup = this.getAgeGroup(age);
    const totalTime = this.lab_wait + this.lab_appt + duration;

    let lp = 0; // Lost Productivity
    let ic = 0; // Informal Caregiving
    let oop = 0; // Out of Pocket

    // Lost Productivity (only for working age)
    if (ageGroup === '15-64') {
      lp = totalTime * wage;
    }

    // Informal Caregiving
    if (ageGroup === '0-14') {
      ic = totalTime * wage * this.caregiver_0_14;
    } else {
      ic = totalTime * wage * this.caregiver_15;
    }

    // Out of Pocket (travel + parking, no meal for lab visits)
    oop = (distance * this.car_cost_per_km) + meal + parking;

    return {
      serviceType: 'Lab Visit',
      ageGroup,
      lostProductivity: lp,
      informalCaregiving: ic,
      outOfPocket: oop,
      totalCost: lp + ic + oop,
      breakdown: {
        wage,
        distance,
        duration,
        age,
        meal,
        parking,
        totalTime
      }
    };
  }

  // Dedicated functions for each age group - Lab Visits
  calculateLabVisitChild(params = {}) {
    return this.calculateLabVisit({ ...params, age: 10 }); // Representative age for 0-14
  }

  calculateLabVisitAdult(params = {}) {
    return this.calculateLabVisit({ ...params, age: 40 }); // Representative age for 15-64
  }

  calculateLabVisitSenior(params = {}) {
    return this.calculateLabVisit({ ...params, age: 70 }); // Representative age for 65+
  }

  // Calculate all service types at once
  calculateAllServices(params = {}) {
    return {
      familyMedicine: this.calculateFamilyMedicine(params),
      emergencyDepartment: this.calculateEmergencyDepartment(params),
      hospitalization: this.calculateHospitalization(params),
      virtualVisit: this.calculateVirtualVisit(params),
      labVisit: this.calculateLabVisit(params)
    };
  }

  // Calculate costs for a specific age group across all services
  calculateByAgeGroup(age, params = {}) {
    const ageParams = { ...params, age };
    return this.calculateAllServices(ageParams);
  }

  // Calculate costs for different distances
  calculateByDistance(distance, params = {}) {
    const distanceParams = { ...params, distance };
    return this.calculateAllServices(distanceParams);
  }

  // Calculate costs for different wages
  calculateByWage(wage, params = {}) {
    const wageParams = { ...params, wage };
    return this.calculateAllServices(wageParams);
  }

  // Sensitivity analysis - calculate costs across a range of values
  sensitivityAnalysis(paramName, minValue, maxValue, step, baseParams = {}) {
    const results = [];
    
    for (let value = minValue; value <= maxValue; value += step) {
      const params = { ...baseParams, [paramName]: value };
      const costs = this.calculateAllServices(params);
      
      results.push({
        [paramName]: value,
        ...costs
      });
    }
    
    return results;
  }

  // Format cost for display
  formatCost(cost) {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cost);
  }

  // Get cost breakdown as percentage
  getCostBreakdown(costResult) {
    const total = costResult.totalCost;
    return {
      lostProductivityPercent: total > 0 ? (costResult.lostProductivity / total) * 100 : 0,
      informalCaregivingPercent: total > 0 ? (costResult.informalCaregiving / total) * 100 : 0,
      outOfPocketPercent: total > 0 ? (costResult.outOfPocket / total) * 100 : 0
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PFCCalculator;
}

// Example usage:
/*
const calculator = new PFCCalculator();

// Calculate costs for a 40-year-old with default parameters
const costs = calculator.calculateAllServices({ age: 40 });

// Calculate costs for different age groups
const childCosts = calculator.calculateByAgeGroup(10);
const adultCosts = calculator.calculateByAgeGroup(40);
const seniorCosts = calculator.calculateByAgeGroup(70);

// Calculate costs for different distances
const localCosts = calculator.calculateByDistance(10);
const regionalCosts = calculator.calculateByDistance(100);

// Sensitivity analysis for wage
const wageSensitivity = calculator.sensitivityAnalysis('wage', 15, 100, 5, { age: 40 });

console.log('Family Medicine Cost:', calculator.formatCost(costs.familyMedicine.totalCost));
*/ 