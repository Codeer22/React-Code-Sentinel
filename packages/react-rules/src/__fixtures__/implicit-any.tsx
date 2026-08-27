function UserCard(props) {
  return props.name;
}

function ProductCard(props: any) {
  return props.title;
}

interface ValidCardProps {
  title: string;
}

function ValidCard(
  props: ValidCardProps,
) {
  return props.title;
}
