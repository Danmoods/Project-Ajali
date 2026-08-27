from marshmallow import Schema, fields, validate


class MediaSchema(Schema):
    id = fields.Int(
        dump_only=True
    )

    incident_id = fields.Int(
        dump_only=True
    )

    file_url = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255)
    )

    media_type = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )

    created_at = fields.DateTime(
        dump_only=True
    )