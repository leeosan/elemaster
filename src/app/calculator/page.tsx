"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
export default function CalculatorPage() {
  const router = useRouter()
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState("")
  const [op, setOp] = useState("")
  const [newNum, setNewNum] = useState(true)
  const handleNum = (n: string) => {
    if (newNum) { setDisplay(n); setNewNum(false) }
    else setDisplay(display === "0" ? n : display + n)
  }
  const handleDot = () => {
    if (newNum) { setDisplay("0."); setNewNum(false) }
    else if (!display.includes(".")) setDisplay(display + ".")
  }
  const handleOp = (o: string) => { setPrev(display); setOp(o); setNewNum(true) }
  const handleEqual = () => {
    if (!op || !prev) return
    const a = parseFloat(prev), b = parseFloat(display)
    let r = 0
    if (op === "+") r = a + b
    else if (op === "-") r = a - b
    else if (op === "*") r = a * b
    else if (op === "/") r = b !== 0 ? a / b : 0
    else if (op === "pow") r = Math.pow(a, b)
    setDisplay(String(parseFloat(r.toFixed(10))))
    setOp(""); setPrev(""); setNewNum(true)
  }
  const handleFunc = (f: string) => {
    const a = parseFloat(display)
    let r = 0
    if (f === "sqrt") r = Math.sqrt(a)
    else if (f === "sin") r = Math.sin(a * Math.PI / 180)
    else if (f === "cos") r = Math.cos(a * Math.PI / 180)
    else if (f === "tan") r = Math.tan(a * Math.PI / 180)
    else if (f === "log") r = Math.log10(a)
    else if (f === "ln") r = Math.log(a)
    else if (f === "inv") r = 1 / a
    else if (f === "pi") { setDisplay(String(Math.PI)); setNewNum(true); return }
    setDisplay(String(parseFloat(r.toFixed(10))))
    setNewNum(true)
  }
  const handleClear = () => { setDisplay("0"); setPrev(""); setOp(""); setNewNum(true) }
  const handleBack = () => { if (display.length <= 1) setDisplay("0"); else setDisplay(display.slice(0, -1)) }
  const handleSign = () => setDisplay(String(parseFloat(display) * -1))
  const btn = (label: string, action: () => void, color = "bg-white text-gray-800") =>
    <button key={label} onClick={action} className={color + " rounded-xl py-4 text-sm font-semibold shadow hover:opacity-80 active:scale-95 transition-all"}>{label}</button>
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-sm mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-gray-500 text-sm">← 뒤로</button>
          <h1 className="text-xl font-bold text-gray-800 mt-1">공학용 계산기</h1>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <div className="text-right text-gray-400 text-sm h-5">{prev} {op}</div>
          <div className="text-right text-white text-3xl font-light mt-1">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {btn("sin", () => handleFunc("sin"), "bg-blue-100 text-blue-700")}
          {btn("cos", () => handleFunc("cos"), "bg-blue-100 text-blue-700")}
          {btn("tan", () => handleFunc("tan"), "bg-blue-100 text-blue-700")}
          {btn("log", () => handleFunc("log"), "bg-blue-100 text-blue-700")}
          {btn("ln", () => handleFunc("ln"), "bg-blue-100 text-blue-700")}
          {btn("√", () => handleFunc("sqrt"), "bg-blue-100 text-blue-700")}
          {btn("xʸ", () => handleOp("pow"), "bg-blue-100 text-blue-700")}
          {btn("1/x", () => handleFunc("inv"), "bg-blue-100 text-blue-700")}
          {btn("π", () => handleFunc("pi"), "bg-blue-100 text-blue-700")}
          {btn("+/-", handleSign, "bg-gray-200 text-gray-800")}
          {btn("AC", handleClear, "bg-red-100 text-red-600")}
          {btn("⌫", handleBack, "bg-gray-200 text-gray-800")}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {btn("7", () => handleNum("7"))}
          {btn("8", () => handleNum("8"))}
          {btn("9", () => handleNum("9"))}
          {btn("÷", () => handleOp("/"), "bg-orange-100 text-orange-600")}
          {btn("4", () => handleNum("4"))}
          {btn("5", () => handleNum("5"))}
          {btn("6", () => handleNum("6"))}
          {btn("×", () => handleOp("*"), "bg-orange-100 text-orange-600")}
          {btn("1", () => handleNum("1"))}
          {btn("2", () => handleNum("2"))}
          {btn("3", () => handleNum("3"))}
          {btn("-", () => handleOp("-"), "bg-orange-100 text-orange-600")}
          {btn("0", () => handleNum("0"))}
          {btn(".", handleDot)}
          {btn("=", handleEqual, "bg-blue-600 text-white")}
          {btn("+", () => handleOp("+"), "bg-orange-100 text-orange-600")}
        </div>
      </div>
    </div>
  )
}
