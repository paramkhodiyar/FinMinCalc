"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot
} from "recharts";
import { 
  Plus, 
  Trash2, 
  Calculator, 
  TrendingUp, 
  Info,
  CheckCircle2,
  AlertCircle,
  Play
} from "lucide-react";
import { calculateNPV, calculateIRR, calculatePerpetuityNPV } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NpvProfile({ onDataChange }: { onDataChange: (data: any, triggerAi?: boolean) => void }) {
  // Input states
  const [initialInvestment, setInitialInvestment] = useState(100000);
  const [numYears, setNumYears] = useState(5);
  const [isPerpetuity, setIsPerpetuity] = useState(false);
  const [isConstant, setIsConstant] = useState(false);
  const [cashFlows, setCashFlows] = useState<number[]>([25000, 30000, 35000, 40000, 45000]);
  const [constantCashFlow, setConstantCashFlow] = useState(30000);
  const [maxRate, setMaxRate] = useState(40);
  
  // State for calculation (frozen values)
  const [isCalculated, setIsCalculated] = useState(false);
  const [calcData, setCalcData] = useState<any>(null);
  const [viewDomain, setViewDomain] = useState<[number, number]>([0, 40]);

  // Handle generation
  const handleGenerate = () => {
    const data = {
      initialInvestment,
      cashFlows: [...cashFlows],
      isPerpetuity,
      constantCashFlow,
      numYears,
      maxRate
    };
    setCalcData(data);
    setIsCalculated(true);
    
    // Calculate IRR for the new data
    const fullCFs = [-Math.abs(initialInvestment), ...cashFlows];
    const irr = isPerpetuity 
      ? (constantCashFlow / Math.abs(initialInvestment)) * 100 
      : (calculateIRR(fullCFs) ?? 0) * 100;

    onDataChange({
      initialInvestment: -Math.abs(initialInvestment),
      cashFlows: [...cashFlows],
      isPerpetuity,
      irr: irr
    }, true); // Pass triggerAi = true to parent
  };

  // Computed values for the graph (using calcData if available)
  const fullCashFlows = useMemo(() => {
    if (!calcData) return [];
    return [-Math.abs(calcData.initialInvestment), ...calcData.cashFlows];
  }, [calcData]);

  const irrResult = useMemo(() => {
    if (!calcData) return null;
    if (calcData.isPerpetuity) {
      const i = Math.abs(calcData.initialInvestment);
      if (calcData.constantCashFlow <= 0 || i === 0) return null;
      return (calcData.constantCashFlow / i) * 100;
    }
    const val = calculateIRR(fullCashFlows);
    return val !== null ? val * 100 : null;
  }, [fullCashFlows, calcData]);

  // Update viewDomain when calculation happens
  useEffect(() => {
    if (isCalculated) {
      setViewDomain([0, Math.max(calcData?.maxRate || 40, (irrResult || 0) + 10)]);
    }
  }, [isCalculated, calcData?.maxRate, irrResult]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!isCalculated) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 0.1;
      const delta = e.deltaY > 0 ? 1 + zoomFactor : 1 - zoomFactor;
      
      const [left, right] = viewDomain;
      const range = right - left;
      const newRange = range * delta;
      const mid = (left + right) / 2;
      
      const newLeft = Math.max(-20, mid - newRange / 2);
      const newRight = mid + newRange / 2;
      
      setViewDomain([newLeft, newRight]);
    }
  };

  const resetZoom = () => {
    if (calcData) {
      setViewDomain([0, Math.max(calcData.maxRate, (irrResult || 0) + 10)]);
    }
  };

  const chartData = useMemo(() => {
    if (!isCalculated || !calcData) return [];
    const data = [];
    const [left, right] = viewDomain;
    const step = (right - left) / 200;
    
    for (let r = left; r <= right; r += step) {
      const rate = r / 100;
      let npv = 0;
      if (calcData.isPerpetuity) {
        npv = calculatePerpetuityNPV(rate, Math.abs(calcData.initialInvestment), calcData.constantCashFlow) ?? 0;
      } else {
        npv = calculateNPV(rate, fullCashFlows);
      }
      if (!isNaN(npv) && isFinite(npv)) {
        data.push({ rate: parseFloat(r.toFixed(3)), npv: parseFloat(npv.toFixed(2)) });
      }
    }
    return data;
  }, [fullCashFlows, calcData, isCalculated, viewDomain]);

  // Sync cash flows when numYears changes (Inputs only)
  useEffect(() => {
    if (cashFlows.length !== numYears) {
      const newCFs = [...cashFlows];
      if (numYears > cashFlows.length) {
        for (let i = cashFlows.length; i < numYears; i++) {
          newCFs.push(isConstant ? constantCashFlow : 0);
        }
      } else {
        newCFs.splice(numYears);
      }
      setCashFlows(newCFs);
    }
  }, [numYears]);

  // Sync constant cash flow (Inputs only)
  useEffect(() => {
    if (isConstant) {
      setCashFlows(new Array(numYears).fill(constantCashFlow));
    }
  }, [isConstant, constantCashFlow, numYears]);

  const handleCfChange = (index: number, value: number) => {
    const newCFs = [...cashFlows];
    newCFs[index] = value;
    setCashFlows(newCFs);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-white">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">NPV Profile Generator</h1>
          <p className="text-gray-500 mt-1">Visualize how Net Present Value changes with discount rates.</p>
        </div>
        <AnimatePresence>
          {isCalculated && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-4"
            >
              <div className="premium-card px-6 py-4 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">IRR</span>
                <span className={cn(
                  "text-2xl font-bold",
                  irrResult !== null && irrResult > 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                )}>
                  {irrResult !== null ? `${irrResult.toFixed(2)}%` : "N/A"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <section className="premium-card p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <Calculator size={18} /> Basic Parameters
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Initial Investment ($)</label>
              <input 
                type="number" 
                value={initialInvestment} 
                onChange={(e) => setInitialInvestment(Number(e.target.value))}
                className="premium-input"
              />
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="perpetuity" 
                checked={isPerpetuity}
                onChange={(e) => setIsPerpetuity(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <label htmlFor="perpetuity" className="text-sm font-medium">Indefinite (Perpetuity)</label>
            </div>

            {!isPerpetuity && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Number of Years</label>
                <input 
                  type="number" 
                  min="1" max="50"
                  value={numYears} 
                  onChange={(e) => setNumYears(Number(e.target.value))}
                  className="premium-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Max Rate on Graph (%)</label>
              <input 
                type="number" 
                value={maxRate} 
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="premium-input"
              />
            </div>
          </section>

          <section className="premium-card p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <TrendingUp size={18} /> Cash Flows
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <input 
                type="checkbox" 
                id="constant" 
                checked={isConstant || isPerpetuity}
                disabled={isPerpetuity}
                onChange={(e) => setIsConstant(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
              />
              <label htmlFor="constant" className="text-sm font-medium">Constant Cash Flow</label>
            </div>

            {(isConstant || isPerpetuity) ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Annual Cash Flow ($)</label>
                <input 
                  type="number" 
                  value={constantCashFlow} 
                  onChange={(e) => setConstantCashFlow(Number(e.target.value))}
                  className="premium-input"
                />
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {cashFlows.map((cf, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-12">YEAR {i+1}</span>
                    <input 
                      type="number" 
                      value={cf} 
                      onChange={(e) => handleCfChange(i, Number(e.target.value))}
                      className="premium-input text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <button 
            onClick={handleGenerate}
            className="w-full premium-button py-4 text-lg font-bold shadow-lg shadow-blue-100 bg-blue-600 hover:bg-blue-700"
          >
            <Play size={20} fill="currentColor" /> Generate Analysis
          </button>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {!isCalculated ? (
            <div className="premium-card h-[500px] flex flex-col items-center justify-center text-center p-8 border-dashed border-2">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="text-gray-300 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-400">Ready to Analyze</h3>
              <p className="text-gray-400 max-w-xs mt-2">
                Enter your financial parameters and click "Generate Analysis" to view the NPV profile and IRR.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div 
                className="premium-card p-8 h-[500px] relative group"
                onWheel={handleWheel}
              >
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={resetZoom}
                    className="premium-button py-1 px-3 text-xs bg-white text-black border border-gray-200 hover:bg-gray-50"
                  >
                    Reset Zoom
                  </button>
                </div>
                <div className="absolute top-4 left-4 z-10">
                   <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                     <Info size={12} /> Pinch/Ctrl + Scroll to Zoom
                   </span>
                </div>
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="rate" 
                      type="number"
                      domain={viewDomain}
                      allowDataOverflow
                      label={{ value: 'Discount Rate (%)', position: 'bottom', offset: 0 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'NPV ($)', angle: -90, position: 'left' }} 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(val: any) => [`$${val.toLocaleString()}`, 'NPV']}
                      labelFormatter={(label) => `Rate: ${label}%`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <ReferenceLine y={0} stroke="#111" strokeWidth={1} />
                    {irrResult !== null && (
                      <ReferenceDot 
                        x={irrResult} 
                        y={0} 
                        r={5} 
                        fill="var(--color-accent)" 
                        stroke="white" 
                        strokeWidth={2}
                      />
                    )}
                    {irrResult !== null && (
                      <ReferenceLine 
                        x={irrResult} 
                        stroke="var(--color-accent)" 
                        strokeDasharray="3 3"
                        label={{ position: 'top', value: `IRR: ${irrResult.toFixed(2)}%`, fill: 'var(--color-accent)', fontSize: 12, fontWeight: 'bold' }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="npv" 
                      stroke="var(--color-primary)" 
                      strokeWidth={3} 
                      dot={false}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="premium-card p-6">
                  <h4 className="font-bold flex items-center gap-2 mb-4">
                    <Info size={16} className="text-blue-500" />
                    What this means
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The NPV profile shows the project's sensitivity to the discount rate. 
                    Where the line crosses the x-axis (NPV = 0) is the <strong>Internal Rate of Return (IRR)</strong>. 
                    If your required rate of return is less than the IRR, the project is considered viable.
                  </p>
                </div>
                <div className="premium-card p-6">
                  <h4 className="font-bold flex items-center gap-2 mb-4">
                    <CheckCircle2 size={16} className="text-green-500" />
                    Metric Insights
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max NPV (at 0%)</span>
                      <span className="font-bold">${chartData[0]?.npv.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Profitability Range</span>
                      <span className="font-bold text-[var(--color-success)]">0% to {irrResult?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
