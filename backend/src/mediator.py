from typing import Dict, List, Any


class Mediator:
    def __init__(self, mediator_id: str):
        self.id = mediator_id
    
    def propose_topic(self) -> Dict[str, Any]:
        return {"id": "topic_1", "title": "Default Topic", "description": "A default debate topic"}
    
    def orchestrate_debate_turn(self, topic: Dict[str, Any], candidates: List[Any],
                               turn_number: int) -> Dict[str, Any]:
        statements = []
        for candidate in candidates:
            statement = candidate.craft_debate_statement(topic, turn_number, statements)
            statements.append(statement)
        return {"topic": topic, "turn": turn_number, "statements": statements}
    
    def publish_debate_transcript(self, debate_session: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {"transcript": debate_session, "mediator_id": self.id}