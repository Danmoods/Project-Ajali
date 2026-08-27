from extensions import ma
from models.incident import Incident

class IncidentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Incident
        load_instance = True

incident_schema = IncidentSchema()
incidents_schema = IncidentSchema(many=True)

