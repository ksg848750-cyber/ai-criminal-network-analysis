from app.verification.auditor import VerificationAuditor

system_leads = {}
auditor = VerificationAuditor()

def get_leads():
    return system_leads

def set_leads(leads):
    global system_leads
    system_leads = leads
    
def get_lead(lead_id):
    return system_leads.get(lead_id)
