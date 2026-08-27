from marshmallow import Schema, fields, validate


class CommunityPostSchema(Schema):
    id = fields.Int(
        dump_only=True
    )

    user_id = fields.Int(
        dump_only=True
    )

    content = fields.Str(
        required=True,
        validate=validate.Length(min=1)
    )

    created_at = fields.DateTime(
        dump_only=True
    )

    updated_at = fields.DateTime(
        dump_only=True
    )