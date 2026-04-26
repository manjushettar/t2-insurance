export function getAIContext(state: any) {
    const context: string[] = [];
  
    if (!state.cyberSafety.mfaEnabled) {
      context.push(
        "Missing MFA weakens cyber readiness and may reduce carrier confidence for cyber liability coverage."
      );
    }
  
    if (state.property.propertyProtectionScore < 70) {
      context.push(
        "Weak property protection increases fire and physical loss exposure. Improving alarms, sprinklers, inspections, or maintenance documentation can strengthen underwriting readiness."
      );
    }
  
    if (state.claimsFinancial.claimsOpenCount > 0) {
      context.push(
        "Open claims increase underwriting concern and may act as a temporary readiness cap until resolved."
      );
    }
  
    if (state.claimsFinancial.claimFrequencyRate > 0.5) {
      context.push(
        "Higher claim frequency may reduce carrier appetite and increase expected premium pricing."
      );
    }
  
    if (!state.cyberSafety.incidentResponsePlan || !state.cyberSafety.vendorRiskManagement) {
      context.push(
        "Missing incident response planning or vendor risk management weakens the cyber risk posture and should be addressed before submission."
      );
    }
  
    return context;
  }