from marshmallow import Schema, fields, validate


class IncidentSchema(Schema):
    id = fields.Int(dump_only=True)

    user_id = fields.Int(
        dump_only=True
    )

    title = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100)
    )

    description = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=300)
    )

    incident_type = fields.Str(
        required=True,
        validate=validate.OneOf([
            "red-flag",
            "intervention"
        ])
    )

    latitude = fields.Float(
        required=True
    )

    longitude = fields.Float(
        required=True
    )

    status = fields.Str(
        dump_only=True
    )

    created_at = fields.DateTime(
        dump_only=True
    )

    updated_at = fields.DateTime(
        dump_only=True
    )