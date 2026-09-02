import fs from "node:fs"; import vm from "node:vm"; import assert from "node:assert";
const NAMES=["PLATES","BOOKS","ADJACENT","LIVES","DOMAINS","DCOLOR","PRINCIPLES","PEOPLE","SOURCES","MANUALS","SLIPWAY","CORRECTIONS"];
function grab(file){
  const L=fs.readFileSync(file,"utf8").split("\n");
  const a=L.findIndex(l=>l.includes("<script>"));
  const b=L.findIndex((l,i)=>i>a&&l.includes("ENGINE ====="));
  const ctx=vm.createContext({});
  vm.runInContext(L.slice(a+1,b).join("\n")+`\n;globalThis.__D={${NAMES.join(",")}};`,ctx);
  return ctx.__D;
}
const A=grab(process.argv[2]), B=grab(process.argv[3]);
let bad=0;
for(const n of NAMES){
  try{ assert.deepStrictEqual(JSON.parse(JSON.stringify(B[n])),JSON.parse(JSON.stringify(A[n]))); console.log(`  ok   ${n}`); }
  catch(e){ bad++; console.log(`  DIFF ${n}: ${String(e.message).split("\n")[0]}`); }
}
// engine + css must survive byte-identical
const eng=f=>{const s=fs.readFileSync(f,"utf8");return s.slice(s.indexOf("ENGINE ====="),s.lastIndexOf("</script>"));};
const css=f=>{const s=fs.readFileSync(f,"utf8");return s.slice(s.indexOf("<style>"),s.indexOf("</style>"));};
const eqEng=eng(process.argv[2]).replace(/\s+/g,"")===eng(process.argv[3]).replace(/\s+/g,"");
const eqCss=css(process.argv[2]).replace(/\s+/g,"")===css(process.argv[3]).replace(/\s+/g,"");
console.log(`  ${eqEng?"ok  ":"DIFF"} engine identical`); console.log(`  ${eqCss?"ok  ":"DIFF"} css identical`);
if(!eqEng||!eqCss)bad++;
console.log(bad? `\nFAIL — ${bad} difference(s)`:"\nPASS — rebuild is equivalent to the original");
process.exit(bad?1:0);
