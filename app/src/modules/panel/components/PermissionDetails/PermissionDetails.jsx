import './PermissionDetails.css'

export default function PermissionDetails({ permission }) {
  if (!permission) return null;

  const {
    id,
    name,
    alias,
    description,
    type,
    status,
    isActive,
    createdAt,
    createdBy,
    typeName
  } = permission;

  return (
    <div className="lx-c-permission-details">
      <div className="lx-c-permission-details-title">Detalles</div>

      <div className="lx-c-permission-details-grid">
        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">ID</span>
          <span className="lx-c-permission-details-value">{id}</span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Nombre</span>
          <span className="lx-c-permission-details-value">{name}</span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Alias</span>
          <span className="lx-c-permission-details-value">{alias}</span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Descripción</span>
          <span className="lx-c-permission-details-value">{description}</span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Tipo</span>
          <span className="lx-c-permission-details-value">
            {typeName} ({type})
          </span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Estado</span>
          <span className="lx-c-permission-details-badge">
            {status}
          </span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Activo</span>
          <span
            className={`lx-c-permission-details-badge ${isActive
                ? "lx-c-permission-details-badge-success"
                : "lx-c-permission-details-badge-danger"
              }`}
          >
            {isActive ? "Sí" : "No"}
          </span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Creado el</span>
          <span className="lx-c-permission-details-value">
            {new Date(createdAt).toLocaleString()}
          </span>
        </div>

        <div className="lx-c-permission-details-field">
          <span className="lx-c-permission-details-label">Creado por</span>
          <span className="lx-c-permission-details-value">{createdBy}</span>
        </div>
      </div>
    </div>
  );
}
