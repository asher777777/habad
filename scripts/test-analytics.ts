import { getFormSubmissionsAnalytics } from "../src/features/crm/analyticsActions";

async function main() {
  const result = await getFormSubmissionsAnalytics({});
  console.log("Analytics result:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
