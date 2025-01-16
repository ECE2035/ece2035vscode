export const BadgeType = Object.freeze({
  PASSED: Symbol("success"),
  FAILED: Symbol("failed"),
  IN_PROGRESS: Symbol("in-progress"),
  NOT_STARTED: Symbol("not-started"),
  DONE: Symbol('done')
})

export default function Badge({ badgeType }) {

  const getBackgroundColor = () => {
    switch (badgeType) {
      case BadgeType.PASSED: return "#046c4e";
      case BadgeType.FAILED: return "#f05252";
      case BadgeType.IN_PROGRESS: return "#27272a";
      case BadgeType.NOT_STARTED: return "#27272a";
      case BadgeType.DONE: return "#046c4e";
      default: return "";
    }
  }

  const getForegroundColor = () => {
    switch (badgeType) {
      case BadgeType.PASSED: return "#efefef";
      case BadgeType.FAILED: return "#efefef";
      case BadgeType.IN_PROGRESS: return "#efefef";
      case BadgeType.NOT_STARTED: return "#efefef";
      case BadgeType.DONE: return "#efefef";
      default: return "";
    }
  }

  const getText = () => {
    switch (badgeType) {
      case BadgeType.PASSED: return "Passed";
      case BadgeType.FAILED: return "Failed";
      case BadgeType.IN_PROGRESS: return "In Progress";
      case BadgeType.NOT_STARTED: return "Not Started";
      case BadgeType.DONE: return "Done";
      default: return "";
    }
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      paddingLeft: "1.75rem",
      paddingRight: "1.75rem",
      height: "2rem",
      borderRadius: "2px",
      borderColor: getBackgroundColor(),
      backgroundColor: getBackgroundColor(),
      color: getForegroundColor(),
    }}>
      {getText()}
    </div>
  )
}