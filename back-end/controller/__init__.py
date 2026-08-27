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
from .community_controller import (
    CommunityPostController,
    CommunityPostsController,
)
from .incident_controller import (
    IncidentController,
    IncidentMediaController,
    IncidentMediaDetailController,
    IncidentsController,
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

    # Citizen incident reporting and evidence
    api.add_resource(IncidentsController, "/incidents")
    api.add_resource(
        IncidentController,
        "/incidents/<int:incident_id>",
    )
    api.add_resource(
        IncidentMediaController,
        "/incidents/<int:incident_id>/media",
    )
    api.add_resource(
        IncidentMediaDetailController,
        "/incidents/<int:incident_id>/media/<int:media_id>",
    )

    # Community wall
    api.add_resource(CommunityPostsController, "/community/posts")
    api.add_resource(
        CommunityPostController,
        "/community/posts/<int:post_id>",
    )
