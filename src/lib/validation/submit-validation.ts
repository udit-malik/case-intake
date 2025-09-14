export function getMissingSubmitFields(intake: any): string[] {
  const m: string[] = [];
  if (!intake?.client_name?.trim()) m.push("client_name");
  if (!intake?.email?.trim()) m.push("email");
  if (!intake?.incident_date?.trim()) m.push("incident_date");
  if (!intake?.incident_description?.trim()) m.push("incident_description");
  return m;
}

export function getFieldDisplayName(fieldKey: string): string {
  const fieldMap: { [key: string]: string } = {
    client_name: "Name",
    date_of_birth: "DOB",
    email: "Email",
    incident_date: "Incident date",
    incident_description: "Description",
  };
  return fieldMap[fieldKey] || fieldKey;
}
