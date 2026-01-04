import { useState } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, 
  Activity, ArrowRight, Database, CheckSquare 
} from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Connection Failed. Is Backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Test Case Generator</h1>
        <p>Upload Process Flow Diagram to Generate Test Cases.</p>
      </div>

      <div className="card">
        <label className={`upload-area ${preview ? 'has-preview' : ''}`}>
          <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {preview ? (
              <img src={preview} alt="Preview" />
            ) : (
              <Upload size={48} className="text-slate-400" />
            )}
            
            {!file ? (
              <div style={{textAlign: 'center'}}>
                <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
                <div className="text-sm text-slate-400" style={{marginTop: '0.5rem'}}>Supported: PNG, JPG</div>
              </div>
            ) : (
              <div className="file-name">
                {file.name}
              </div>
            )}
          </div>
        </label>

        <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
          {loading ? (
            <>
              <Loader2 className="spinner" size={20} /> Processing Diagram
            </>
          ) : (
            <>
              Generate Test Cases <ArrowRight size={20} />
            </>
          )}
        </button>

        {error && (
          <div className="error-box">
            <AlertCircle size={24} />
            <div>
              <strong>Generation Failed</strong>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="animate-fade-in">
          
          {/* Metrics Summary */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value text-blue-600">{result.metrics.basic_paths_generated}</div>
              <div className="metric-label">Scenarios</div>
            </div>
            <div className="metric-card">
              <div className="metric-value text-green-600">{result.metrics.activity_coverage.toFixed(0)}%</div>
              <div className="metric-label">Activity Coverage</div>
            </div>
            <div className="metric-card">
              <div className="metric-value text-purple-600">{result.metrics.transition_coverage.toFixed(0)}%</div>
              <div className="metric-label">Transition Coverage</div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{color: 'var(--text-main)', marginTop: '3rem'}}>
            <Activity className="text-blue-600" /> Generated Test Cases
          </h2>

          {/* Test Cases List */}
          {result.test_cases.map((tc) => (
            <div key={tc.scenario_id} className="tc-card">
              {/* ID & Scenario Name */}
              <div className="tc-header">
                <div className="tc-title">
                  <FileText size={20} className="text-slate-500" />
                  <span style={{color: 'var(--primary)', fontFamily: 'monospace'}}>{tc.scenario_id}:</span>
                  <span>{tc.scenario_name}</span>
                </div>
                <div className="tc-meta">
                  {tc.steps.length} Steps
                </div>
              </div>

              <div className="tc-body">
                
                <div className="ai-data-grid">
                  <div className="data-box">
                    <div className="data-title">
                      <Database size={16} /> Test Data Input
                    </div>
                    {tc.test_data && Object.keys(tc.test_data).length > 0 ? (
                      <div className="data-content">
                        {Object.entries(tc.test_data).map(([key, value]) => (
                          <div key={key} className="key-value-row">
                            <span className="d-key">{key}</span>
                            <span className="d-val">
                              {typeof value === 'object' && value !== null 
                                ? JSON.stringify(value).replace(/[{}"]/g, ' ')
                                : String(value)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic">No specific input data required</div>
                    )}
                  </div>

                  {/* Expected Output */}
                  <div className="data-box success-border">
                    <div className="data-title success-text">
                      <CheckSquare size={16} /> Expected Output
                    </div>
                    <div className="expected-content">
                      {tc.expected_output || "Process completes successfully based on the defined flow."}
                    </div>
                  </div>
                </div>

                {/* Steps Sequence */}
                <div className="steps-container">
                  <div className="steps-header-label">
                    Test Step
                  </div>
                  {tc.steps.map((step) => (
                    <div key={step.step_no} className="step-item">
                      <div className="step-number">{step.step_no}</div>
                      <div className="step-content">
                        <div className="step-main">
                          {step.swimlane && (
                            <span className="swimlane-badge">
                              {step.swimlane}
                            </span>
                          )}
                          <span className="step-text">{step.activity}</span>
                        </div>
                        
                        {step.condition && (
                          <div className="condition-branch">
                            <span className="cond-label">Condition:</span> 
                            <span className="cond-val">{step.condition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}

          <div className="mt-8 text-center text-sm text-slate-400 mb-8">
            Generated from diagram: <b>{result.diagram_name}</b>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;