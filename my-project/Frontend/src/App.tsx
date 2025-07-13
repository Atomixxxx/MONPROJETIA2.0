import React from 'react';
import './index.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import AdvancedFeatures from './components/AdvancedFeatures';
import AgentSelector from './components/AgentSelector';
import ChatPanel from './components/ChatPanel';
import ConnectionStatus from './components/ConnectionStatus';
import EditorPanel from './components/EditorPanel';
import ErrorBoundary from './components/ErrorBoundary';
import ExecutionPanel from './components/ExecutionPanel';
import FileExplorer from './components/FileExplorer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Layout from './components/Layout';
import MonacoEditor from './components/MonacoEditor';
import NotificationSystem from './components/NotificationSystem';
import ProjectSidebar from './components/ProjectSidebar';
import ProjectTemplates from './components/ProjectTemplates';
import TerminalPanel from './components/TerminalPanel';
import Tooltip from './components/Tooltip';
import WorkflowResults from './components/WorkflowResults';

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Layout>
          <Switch>
            <Route path="/advanced-features" component={AdvancedFeatures} />
            <Route path="/agent-selector" component={AgentSelector} />
            <Route path="/chat" component={ChatPanel} />
            <Route path="/connection-status" component={ConnectionStatus} />
            <Route path="/editor" component={EditorPanel} />
            <Route path="/execution" component={ExecutionPanel} />
            <Route path="/file-explorer" component={FileExplorer} />
            <Route path="/keyboard-shortcuts" component={KeyboardShortcuts} />
            <Route path="/monaco-editor" component={MonacoEditor} />
            <Route path="/notification-system" component={NotificationSystem} />
            <Route path="/project-sidebar" component={ProjectSidebar} />
            <Route path="/project-templates" component={ProjectTemplates} />
            <Route path="/terminal" component={TerminalPanel} />
            <Route path="/tooltip" component={Tooltip} />
            <Route path="/workflow-results" component={WorkflowResults} />
            <Route path="/" exact>
              <h1>Welcome to My Project</h1>
            </Route>
          </Switch>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
};

export default App;