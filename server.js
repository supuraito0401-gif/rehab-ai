const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function diseaseHint(disease){
 switch(disease){
  case "膝OA": return "膝関節の疼痛、可動域、歩行能力";
  case "腰痛": return "体幹筋、姿勢、疼痛";
  case "脳梗塞": return "麻痺、バランス、ADL";
  default: return "身体機能と疼痛、動作";
 }
}

async function callAI(prompt){
 const res = await fetch("https://api.openai.com/v1/chat/completions",{
  method:"POST",
  headers:{
   "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
   "Content-Type":"application/json"
  },
  body:JSON.stringify({
   model:"gpt-4.1",
   messages:[{role:"user",content:prompt}],
   temperature:0.3
  })
 });
 const data = await res.json();
 return data.choices[0].message.content;
}

app.post("/api/generate", async (req,res)=>{
 try{
  const {disease, voice, subjective, treatments} = req.body;

  // ①要約
  const summary = await callAI(`
理学療法士として以下を要約してください。
重要な症状・変化・動作のみ抽出。

${voice}
`);

  // ②カルテ生成
  const result = await callAI(`
理学療法士としてSOAP形式で記録を作成。

疾患観点: ${diseaseHint(disease)}
主訴: ${subjective}
要約: ${summary}
実施: ${treatments.join("、")}

S:
O:
A:
P:
`);

  res.json({text: result, summary});

 }catch(e){
  console.log(e);
  res.status(500).json({error:"失敗"});
 }
});

app.listen(3000,()=>console.log("AIサーバー起動 http://localhost:3000"));