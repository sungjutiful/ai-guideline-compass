from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ConsentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    agreed_at: datetime
