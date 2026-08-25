"""Central route registration for Ajali controller resources."""

from .admin_controller import (
    AdminController,
    AdminIncidentController,
    AdminIncidentsController,
)
from .auth_controller import (
    ChangePasswordController,
    CurrentUserController,
    LoginController,
    RegisterController,
)


def register_resources(api):
    """Attach all currently implemented controller resources to an API."""
    # Authentication and profile
    api.add_resource(RegisterController, "/auth/register")
    api.add_resource(LoginController, "/auth/login")
    api.add_resource(CurrentUserController, "/auth/me")
    api.add_resource(ChangePasswordController, "/auth/change-password")

    # Administrator incident-review workflow
    api.add_resource(AdminController, "/admin/dashboard")
    api.add_resource(AdminIncidentsController, "/admin/incidents")
    api.add_resource(
        AdminIncidentController,
        "/admin/incidents/<int:incident_id>",
    )
