import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Link as LinkIcon, FileText, Clock, ExternalLink, ShieldCheck, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

interface AIPanelProps {
  caseId: string;
  onAction: (action: any) => void;
  contextData: any; // { selectionType, selectedData, activeLead }
  intelligence: any;
  onVerify?: (leadId: string) => void;
  onReject?: (leadId: string) => void;
  onPatternAction?: (pattern: any, action: 'SHOW_ON_GRAPH' | 'VIEW_TIMELINE') => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  actions?: any[];
  patterns?: any[];
}

const AIPanel: React.FC<AIPanelProps> = ({ caseId, onAction, contextData, intelligence, onVerify, onReject, onPatternAction }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const { token } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (intelligence && messages.length === 0) {
      const patternCount = intelligence.patterns?.length || 0;
      if (patternCount > 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'ai',
            text: `**CASE INTELLIGENCE READY**\n\nI found ${patternCount} notable pattern${patternCount > 1 ? 's' : ''} in this investigation.`,
            patterns: intelligence.patterns
          }
        ]);
      } else {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          text: 'I am your AI Case Investigator. I have analyzed the intelligence for this case. How can I help you?'
        }]);
      }
    }
  }, [intelligence]);

  const handleSend = async () => {
    if (!input.trim() || !token) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/cases/${caseId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage.text })
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        role: 'ai',
        text: data.response_text,
        actions: data.suggested_actions
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'ai',
        text: 'Sorry, I encountered an error communicating with the intelligence engine.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!token) return;
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Generate Case Intelligence Brief" }]);
    
    // Simulate progression for the demo
    const steps = [
      "Analyzing network graph...",
      "Mapping relationships...",
      "Detecting temporal patterns...",
      "Checking cross-case links...",
      "Synthesizing findings..."
    ];
    
    for (const step of steps) {
      setLoadingStep(step);
      await new Promise(r => setTimeout(r, 600));
    }
    setLoadingStep('');

    try {
      const res = await fetch(`http://localhost:8000/cases/${caseId}/brief`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate brief');
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-ai',
        role: 'ai',
        text: data.response_text,
        actions: data.suggested_actions
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'ai',
        text: 'Sorry, failed to generate case brief.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderActionLabel = (action: any) => {
    switch(action.type) {
      case 'HIGHLIGHT_NODES': return <><LinkIcon size={14}/> SHOW ON GRAPH</>;
      case 'SHOW_TIMELINE_EVENT': return <><Clock size={14}/> VIEW TIMELINE</>;
      case 'SHOW_EVIDENCE': return <><FileText size={14}/> VIEW EVIDENCE</>;
      case 'SHOW_CROSS_CASE': return <><ExternalLink size={14}/> VIEW CROSS-CASE</>;
      default: return <><LinkIcon size={14}/> {action.type}</>;
    }
  };

  const renderContext = () => {
    if (!contextData.selectionType) return null;

    if (contextData.selectionType === 'lead' && contextData.activeLead) {
      const lead = contextData.activeLead;
      return (
        <div style={{ padding: '1rem', borderBottom: '1px solid #1f2937', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#f59e0b' }}>Selected Lead</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{lead.explanation}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
             <button 
                onClick={() => onVerify && onVerify(lead.id)}
                style={{ flex: 1, padding: '0.5rem', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}>
                <ShieldCheck size={14} /> Verify
             </button>
             <button 
                onClick={() => onReject && onReject(lead.id)}
                style={{ flex: 1, padding: '0.5rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}>
                <AlertOctagon size={14} /> Reject
             </button>
          </div>
        </div>
      );
    }

    if (contextData.selectionType === 'node' && contextData.selectedData) {
       const node = contextData.selectedData;
       return (
         <div style={{ padding: '1rem', borderBottom: '1px solid #1f2937', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
           <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#3b82f6' }}>Selected Entity</h3>
           <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 'bold' }}>{node.name}</p>
           <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Type: {node.type}</p>
         </div>
       );
    }

    if (contextData.selectionType === 'edge' && contextData.selectedData) {
        const edge = contextData.selectedData;
        return (
          <div style={{ padding: '1rem', borderBottom: '1px solid #1f2937', backgroundColor: 'rgba(139, 92, 246, 0.05)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#8b5cf6' }}>Selected Relationship</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 'bold' }}>{edge.type}</p>
            {edge.timestamp && <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Time: {edge.timestamp}</p>}
          </div>
        );
     }

    return null;
  };

  return (
    <div style={{
      width: '350px',
      backgroundColor: '#111827',
      borderLeft: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #1f2937' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={20} color="#06b6d4" /> AI Investigator
        </h2>
        <button 
          onClick={handleGenerateBrief}
          style={{
            marginTop: '0.75rem', width: '100%',
            padding: '0.5rem', backgroundColor: '#0891b2', color: '#fff',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 600,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#06b6d4'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#0891b2'}
        >
          GENERATE CASE INTELLIGENCE
        </button>
      </div>

      {renderContext()}

      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%'
          }}>
            <div style={{
              backgroundColor: msg.role === 'user' ? '#1f2937' : 'rgba(6, 182, 212, 0.1)',
              border: msg.role === 'ai' ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid #374151',
              padding: '0.75rem',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: msg.role === 'user' ? '#9ca3af' : '#06b6d4', fontWeight: 600, fontSize: '0.75rem' }}>
                {msg.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                {msg.role === 'user' ? 'YOU' : 'AI'}
              </div>
              <div className="prose prose-invert prose-sm">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              
              {msg.patterns && msg.patterns.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {msg.patterns.map((pat: any, i: number) => (
                    <div key={i} style={{ border: '1px solid #374151', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #374151' }}>
                        ⚠ {pat.finding_type.replace('_', ' ')}
                      </div>
                      <div style={{ padding: '0.5rem', backgroundColor: '#111827', fontSize: '0.8rem', color: '#e2e8f0' }}>
                        {pat.description}
                        <div style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                          Date window: {pat.time_window}
                        </div>
                      </div>
                      <div style={{ display: 'flex', borderTop: '1px solid #374151' }}>
                        <button 
                          onClick={() => onPatternAction && onPatternAction(pat, 'SHOW_ON_GRAPH')}
                          style={{ flex: 1, padding: '0.5rem', backgroundColor: '#1f2937', color: '#06b6d4', border: 'none', borderRight: '1px solid #374151', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          [SHOW ON GRAPH]
                        </button>
                        <button 
                          onClick={() => onPatternAction && onPatternAction(pat, 'VIEW_TIMELINE')}
                          style={{ flex: 1, padding: '0.5rem', backgroundColor: '#1f2937', color: '#e2e8f0', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          [VIEW TIMELINE]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => onAction(act)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #0891b2',
                        color: '#0891b2',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.backgroundColor = '#0891b2';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#0891b2';
                      }}
                    >
                      {renderActionLabel(act)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <Loader2 size={16} className="animate-spin" /> {loadingStep || 'Analyzing facts...'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this investigation..."
            style={{
              flexGrow: 1,
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '4px',
              outline: 'none',
              fontSize: '0.875rem'
            }}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: '#0891b2',
              color: '#fff',
              border: 'none',
              padding: '0 1rem',
              borderRadius: '4px',
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !input.trim()) ? 0.5 : 1
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
