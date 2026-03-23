import { syncVendorsFromZip } from "@/lib/vendor-sync";

async function main() {
  const summary = await syncVendorsFromZip();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
