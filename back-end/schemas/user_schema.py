from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    id = fields.Int(dump_only=True)

    username = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100)
    )

    email = fields.Email(
        required=True
    )

    phone = fields.Str(
        allow_none=True,
        validate=validate.Length(max=20)
    )

    bio = fields.Str(
        allow_none=True
    )

    profile_photo = fields.Str(
        allow_none=True,
        validate=validate.Length(max=255)
    )

    role = fields.Str(
        dump_only=True
    )

    created_at = fields.DateTime(
        dump_only=True
    )

    updated_at = fields.DateTime(
        dump_only=True
    )