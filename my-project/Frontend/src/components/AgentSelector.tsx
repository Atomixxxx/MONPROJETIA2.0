import React from 'react';

const AgentSelector = () => {
    const [agents, setAgents] = React.useState([]);
    const [selectedAgent, setSelectedAgent] = React.useState(null);

    React.useEffect(() => {
        // Fetch agents from an API or service
        const fetchAgents = async () => {
            // Placeholder for fetching logic
            const response = await fetch('/api/agents');
            const data = await response.json();
            setAgents(data);
        };

        fetchAgents();
    }, []);

    const handleSelect = (agent) => {
        setSelectedAgent(agent);
        // Additional logic for when an agent is selected
    };

    return (
        <div>
            <h2>Select an Agent</h2>
            <ul>
                {agents.map((agent) => (
                    <li key={agent.id} onClick={() => handleSelect(agent)}>
                        {agent.name}
                    </li>
                ))}
            </ul>
            {selectedAgent && (
                <div>
                    <h3>Selected Agent:</h3>
                    <p>{selectedAgent.name}</p>
                </div>
            )}
        </div>
    );
};

export default AgentSelector;