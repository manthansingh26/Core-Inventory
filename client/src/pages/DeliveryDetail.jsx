import { useParams } from 'react-router-dom';
import StockMoveDetail from '../components/StockMoveDetail';
export default function DeliveryDetail() {
  const { id } = useParams();
  return <StockMoveDetail id={id} type="delivery" />;
}
